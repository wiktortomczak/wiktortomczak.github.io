#!/usr/bin/env python

# ./jain-krishna.py  --num_species=100  --m=0.25  --num_steps=7000  --random_seed=5
# ./jain-krishna.py  --num_species=40  --catalysis_proba=0.01282051282051282  --random_seed=0  --num_steps=2000

import collections
import ctypes
import itertools
import json
import os
import struct
import sys

import gflags
import numpy as np
import scipy.linalg
import scipy.sparse.linalg

gflags.DEFINE_integer('num_species', None, '')
gflags.DEFINE_float('catalysis_proba', None, '')
gflags.DEFINE_float('m', None, '')
gflags.DEFINE_integer('num_steps', None, '')
gflags.DEFINE_integer('random_seed', None, '')
gflags.DEFINE_string('out', None, '')
gflags.DEFINE_string('out_format', None, '')
gflags.DEFINE_boolean('out_buffering', True, '')
gflags.DEFINE_boolean('debug', False, '')
gflags.DEFINE_boolean('plot', False, '')
FLAGS = gflags.FLAGS

# Parameters
#  s
#  p / m
#  n


# State
# C

# jak zaczyna sie symulacje, czy oddzialywania to przypadkowa?
# srednia liczba, dyspersja wielkosci / liczby ACS (cykli)

# Monitored quantities:
#   number of links - l
#     phase chart - l(n)
#   species count / fitness - X_i
#   lambda_1
#   graph properties
#     ACS size(s) - s_i
#     connectivity
#     centrality?
#  \lambda_i
#  \tau_g
# average time of arrival of an ACS
# complexity
# boom and bust



# Visualization:
#   species graph: ids, directed links, colors: acs, periphery, background; sizes
#   number of links l(n) (figure 1)
#   dominant ACS size s1(n) (figure 2)
#   species counts
#   event log:
#     removal (species id, fitness, if ACS change)
#     addition (links, if out ACS, if in ACS, if ACS growth)
# controls:
#   go to step, pause / set replay speed
#   load / select simulation
#   run simulation ?
# UI widgets:
#   graph draw
#   line chart
#   bar chart
#   window with text and scroll
#   controls: buttons, slider
# other required functionality:
#   graph layout

def main(argv):
  argv = FLAGS(argv)

  if FLAGS.random_seed is not None:
    np.random.seed(FLAGS.random_seed)

  jk = JainKrishnaModel.FromFlags()
  jk.Run(model_writers=_FilterNotNone([
    ModelWriter.FromFlags(),
    DebugModelWriter if FLAGS.debug else None]))

  if FLAGS.plot:
    import matplotlib.pyplot as plt
    plt.plot(np.arange(jk.num_steps), jk.num_links)
    plt.show()


class JainKrishnaModel(object):

  @classmethod
  def FromFlags(cls):
    assert (FLAGS.catalysis_proba is None) != (FLAGS.m is None)
    if FLAGS.catalysis_proba is not None:
      catalysis_proba = FLAGS.catalysis_proba
    else:
      catalysis_proba = FLAGS.m / (FLAGS.num_species - 1)
    return cls(
      FLAGS.num_species,
      catalysis_proba,
      FLAGS.num_steps)

  def __init__(self, num_species, catalysis_proba, num_steps):
    self._num_species = num_species
    self._catalysis_proba = catalysis_proba
    self._num_steps = num_steps

    self._catalysts = np.empty((num_species, num_species), dtype=np.uint8)
    self._SetRandomCatalysts()  # Init catalysts.

  @property
  def num_steps(self):
    return self._num_steps

  @property
  def catalysts(self):
    return self._catalysts

  # @property
  # def num_links(self):
  #   return np.count_nonzero(
  #     self._catalysts.reshape(len(self._catalysts), -1),
  #     axis=1)

  def links(self):
    return np.argwhere(self._catalysts != 0)[:, ::-1]

  def Run(self, model_writers=()):
    for step_id in itertools.count():
      species_concentrations, lambda_1 = (
        self._ComputeSpeciesConcentrations(self._catalysts))
      # TODO: Random choice if many.
      least_fit_species_id = np.argmin(species_concentrations)

      if model_writers:
        cores, periphery = self._FindCoresAndPeriphery(self._catalysts)

        for writer in model_writers:
          writer.Write(
            self, step_id,
            species_concentrations, least_fit_species_id, lambda_1,
            cores, periphery)

      if step_id + 1 == self._num_steps:  # Never if num_steps is None.
        break

      # Replace least_fit_species_id.
      self._SetRandomCatalysts(least_fit_species_id)

  def _SetRandomCatalysts(self, catalyst_id=None):
    """Randomly initializes catalysis matrix, for all or one given species.

    Args:
      catalyst_id: int. If not given, the entire matrix (all species) is
        initialized. If given, only that particular species is (re)initialized.
    """
    if catalyst_id is None:  # All species.
      self._catalysts[:] = np.random.random(self._catalysts.shape) < self._catalysis_proba
      np.fill_diagonal(self._catalysts, 0)
    else:  # One species.
      self._catalysts[:, catalyst_id] = (
        np.random.random(len(self._catalysts)) < self._catalysis_proba)
      self._catalysts[catalyst_id, :] = (
        np.random.random(len(self._catalysts)) < self._catalysis_proba)
      self._catalysts[catalyst_id, catalyst_id] = 0

  @classmethod
  def _ComputeSpeciesConcentrations(cls, catalysts):
    eigenvalue, eigenvector = PerronEigenvalue(catalysts)
    assert np.isreal(eigenvalue)
    assert np.isreal(eigenvector).all()

    eigenvector_sum = eigenvector.real.sum()
    if eigenvector_sum > 0:
      species_concentration = eigenvector.real.ravel() / eigenvector_sum
    else:
      species_concentration = np.zeros(len(catalysts))

    return species_concentration, eigenvalue.real

  @classmethod
  def _FindCoresAndPeriphery(cls, catalysts):
    graph = Graph.FromAdjacencyMatrix(catalysts)
    cores = [c for c in graph.FindStronglyConnectedComponents() if len(c) > 1]

    try:
      cores_flat = set(itertools.chain(*cores))
    except:
      print >>sys.stderr, '#', cores
      raise
    periphery = set()
    queue = list(cores_flat)
    while queue:
      for neighbor in queue.pop(0).out_neighbors:
        if neighbor not in cores_flat and neighbor not in periphery:
          periphery.add(neighbor)
          queue.append(neighbor)

    return [[v.id for v in c] for c in cores], [v.id for v in periphery]


class ModelWriter(object):

  @classmethod
  def FromFlags(cls):
    if FLAGS.out_format == 'json':
      return JsonModelWriter(OutFile())
    elif FLAGS.out_format == 'binary':
      return BinaryModelWriter(OutFile('b'))
    elif not FLAGS.out_format:
      return None
    else:
      raise ValueError(FLAGS.out_format)

  def Write(self, model, step_id,
            species_concentrations, least_fit_species_id, lambda_1,
            cores, periphery):
    raise NotImplementedError

class JsonModelWriter(object):

  def __init__(self, model_file):
    self._model_file = model_file

  def Write(self, model, step_id,
            species_concentrations, least_fit_species_id, lambda_1,
            cores, periphery):
    model_step = dict(
      links=[{'source': source, 'target': target}
             for source, target in model.links()],
      # lambda_1=lambda_1,
      # concentrations={
      #   species_id: concentration
      #   for species_id, concentration in enumerate(species_concentrations)
      #   if concentration > 0},
      # least_fit_species_id=least_fit_species_id,
      cores=cores,
      periphery=periphery)
    json.dump(model_step, self._model_file)
    self._model_file.write('\n')
    # model_file.flush()  # TODO

class BinaryModelWriter(ModelWriter):

  def __init__(self, model_file):
    self._model_file = model_file

  def Write(self, model, step_id,
            species_concentrations, least_fit_species_id, lambda_1,
            cores, periphery):
    message = ctypes.create_string_buffer(65536)
    offset = 2

    offset += self._PackData(model.links().ravel(), 'B', message, offset)

    struct.pack_into('H', message, offset, len(cores))
    offset += 2
    for core in cores:
      offset += self._PackData(core, 'B', message, offset)

    offset += self._PackData(periphery, 'B', message, offset)

    # Write size prefix; offset = total message size.
    struct.pack_into('H', message, 0, offset)
    self._model_file.write(buffer(message, 0, offset))
    # self._model_file.flush()  # TODO

  @staticmethod
  def _PackData(data, type_format, out_buffer, offset):
    fmt = '%u%c' % (len(data), type_format)
    size = struct.calcsize(fmt) + 2
    struct.pack_into('H', out_buffer, offset, size)
    struct.pack_into(fmt, out_buffer, offset + 2, *data)
    return size

# class DebugModelWriter(object):
        
#       if FLAGS.debug:
#         print 'step=%4u  links=%u  least_fit=%u  lambda_1=%.4f  species=%s  cores=%s' % (
#           step_id+1,
#           np.count_nonzero(self._catalysts),
#           least_fit_species_id,
#           lambda_1,
#           ' '.join([
#             '%u: %.3f' % (i, c)
#             for i, c in enumerate(species_concentrations)
#             if c > 0
#           ]),
#           cores
#         )
    

class Graph(object):

  @classmethod
  def FromAdjacencyMatrix(cls, adjacency_matrix):
    vertices = [cls.Vertex(i) for i in xrange(len(adjacency_matrix))]
    for source, target in np.argwhere(adjacency_matrix != 0)[:, ::-1]:
      vertices[source].out_neighbors.append(vertices[target])
      vertices[target].in_neighbors.append(vertices[source])
    return cls(vertices)

  def __init__(self, vertices):
    self._vertices = vertices

  def FindStronglyConnectedComponents(self):
    dfs_visit_order = []
    self.DepthFirstSearch(lambda v: dfs_visit_order.append(v))

    vertex_to_component = collections.defaultdict(list)
    for vertex in dfs_visit_order[::-1]:
      self._AssignVertexToComponent(vertex, vertex, vertex_to_component)

    return Unique(vertex_to_component.values(), key=id)

  def DepthFirstSearch(self, vertex_func):
    visited = set()
    for vertex in self._vertices:
      self._DepthFirstSearchVisit(vertex, visited, vertex_func)
    
  @classmethod
  def _DepthFirstSearchVisit(cls, vertex, visited, vertex_func):
    if not vertex in visited:
      visited.add(vertex)
      for neighbor in vertex.out_neighbors:
        cls._DepthFirstSearchVisit(neighbor, visited, vertex_func)
      vertex_func(vertex)

  @classmethod
  def _AssignVertexToComponent(cls, vertex, root, vertex_to_component):
    if vertex not in vertex_to_component:
      component = vertex_to_component[vertex] = vertex_to_component[root]
      component.append(vertex)
      for neighbor in vertex.in_neighbors:
        cls._AssignVertexToComponent(neighbor, root, vertex_to_component)

  class Vertex(object):

    def __init__(self, id):
      self.id = id
      self.out_neighbors = []
      self.in_neighbors = []


def Unique(l, key):
  seen = set()
  for e in l:
    key_ = key(e)
    if key_ not in seen:
      seen.add(key_)
      yield e


def PerronEigenvalue(a):
  eigenvector = np.ones(len(a))
  v_prev = None
  for _ in xrange(10):
    v = np.dot(a, eigenvector)

    if v_prev is not None and (v == v_prev).all():
      break
    v_prev = v

    v_sum = v.sum()
    if v_sum > 0:
      eigenvector = v / v_sum
    else:
      eigenvector = np.zeros(len(a))

  eigenvalue = v_sum
  return eigenvalue, eigenvector


def LargestEigenvalue(a):
  val, vec = scipy.linalg.eig(a)
  i = np.argmax(val)
  return val[i], vec[:, i]


def LargestEigenvalueARPACK(a):
  # (eigenvalue, eigenvector), = (
  #   zip(scipy.sparse.linalg.eigs(catalysts.astype('d'), k=1, which='LR')))
  x = scipy.sparse.linalg.eigs(catalysts.astype('d'), k=1, which='LM')
  assert len(x[0]) == 1
  eigenvalue = x[0][0]
  eigenvector = x[1]
  return eigenvalue, eigenvector


def OutFile(mode=''):
  if FLAGS.out is None:
    return None
  if FLAGS.out == '-':
    if FLAGS.out_buffering:
      return sys.stdout
    else:
      return os.fdopen(sys.stdout.fileno(), 'w' + mode, 0)
  else:
    if FLAGS.out_buffering:
      return file(FLAGS.out, 'w' + mode)
    else:
      return file(FLAGS.out, 'w' + mode, 1)


def _FilterNotNone(l):
  return [e for e in l if e is not None]

          
if __name__ == '__main__':
  main(sys.argv)
