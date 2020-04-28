.. TODO: plots
.. TODO: picture 1, picture 2
.. TODO: numbers
.. TODO: answers - errors at extreme angle range??
.. TODO: links to plots
.. TODO: video
.. TODO: TOC
.. TODO: other TODOs
.. TODO: code
.. TODO: Fix TODOs

HC-SR04 distance sensor study
#############################

This is a study of `HC-SR04 ultrasonic distance sensors`__, of the data /
readings they provide and their applicability in the `sumo robot <src_>`_.

__ https://google.com/search?q=HC-SR04+ultrasonic+sensor

Goals / motivations
*******************

The purpose of this study of HC-SR04 distance sensors is to understand

* What kind of vision / perception of the robot's environment the sensors
  provide?
* How to build the robot's object detection system based on these sensors?

Questions
*********

The questions that the study aims to answer are:

1. What readings does a sensor produce?
2. What is a sensor's field of view (receptive field)?
3. | How reliable / unambiguous the readings are?
   | (What extent of object locations maps to a single reading value?)
4. | How consistent the readings are?
   | (What range of readings is produced for a fixed object location / distance?)
5. Do adjacent sensors interfere with each other?
 
Key results
***********

Answers
=======

In summary, the answers to the above questions are:

1. What readings does a sensor produce?

  Most of the time, sensor readings are the distance to the object in its field
  of view, as one would expect. The readings are fairly accurate, the correct
  distance +- TODO mm. This is consistenly so for all object distances and angles
  in the sensor's field of view (answer 2.).  TODO angle error range
  
  However, at object distance over 1m, TODO% readings become (very) inaccurate.
  This is likely due to interference between sensors, whose fields of operation
  overlap, or due to another object affecting the experiment.
  
  | See :ref:`Distance reading vs target angle distribution`.
  | See :ref:`Target angle vs reading error distribution`.
  
  A sensor produces a reading every TODO ms on average, which amounts to 
  TODO readings per 1 s.

2. What is a sensor's field of view (receptive field)?

  A sensor detects objects at a range of distances from 0 mm at least up to 1 m
  and possibly further (answer 1.), and at a range of angles +- TODO deg relative
  to sensor's front axis.
  
  | See :ref:`Distance reading vs target angle distribution`.
  | See :ref:`Target location XY vs distance reading, sliced`.

3. How reliable / unambiguous the readings are?

  Sensor readings reliably reflect object distance, with +- TODO mm accuracy, if
  the object is up to 1m away and possibly further, and at an angle [0, +-TODO]
  deg from the sensor's front axis. If the object is at an angle +-[TODO, TODO]
  deg, TODO% readings are unreliable. The readings do not indicate object's angle,
  obviously.
  
  In others words, given a reading, the object is at the measured distance +- TODO mm,
  at an unknown angle between [TODO, TODO], if the object is sure to be within 1 m
  distance and this angle range. If the object can be at angle TODO, any isolated
  reading is unreliable.

4. How consistent the readings are?

  See :ref:`Target distance vs distance reading distribution`.

5. Do adjacent sensors interfere with each other?

  The sensors interfere in the overlapping areas of their fields of view,
  especially in their parts further away from the sensors.
  
  | See :ref:`Distance reading vs reading error distribution`.
  | See :ref:`Target angle vs reading error distribution`.

Note: Answers related to sensors's distance and angle range were based on the
data from the ``right`` sensor. It was taken as a proxy for a single isolated
sensor, as it overlapped the least with other sensors.

Conclusions
===========

Reliable detection of object's angle in addition to object's distance is only
possible if the angular field of vision [1]_ is limited, thus limiting the
uncertainty about the angle.

.. [1] the range of angles at which the sensor can detect the object at all

Sensors should be placed so that their fields of operation do not overlap,
so facing directions diverging by at least TODO deg.

It could be possible to improve reading accuracy, also in areas of low accuracy
/ sensor overlap, using information from a sequence of readings from all
sensors, rather than from isolated readings without context

Study details
*************

The remaining part of this document explains the study, how the answers were
established.

Experiment
==========

.. TODO: picture 1
   a picture of camera view, dimensions, distances to walls, sensor labels,
   target coordinates xy, target coordinates distance / theta, front axis

Setup
-----

In a controlled experimental session, an :ref:`array of three distance sensors
<Sensors>` were placed on the floor, facing an empty room, and operated. A single
round metal object was :ref:`being moved<Target object>` in front of the sensors
to a number of :ref:`different locations<Target object>`. :ref:`Distance readings
from sensors<Sensor distance readings>` were recorded. The session was also
recorded in :ref:`a video<Sensor target video recording>`, from a camera
installed above the floor, facing down.

Analysis
--------

Later offline, distance readings from the sensors were confronted with distance
information :ref:`extracted from the video<Video object detection>`. Sensor
distance readings were :ref:`related<Data analysis>` to locations / distance
estimates of the metal object, acting as controlled sensor target. A number of
:ref:`charts<Charts>` displaying how the readings relate to the object's
locations were drawn and examined. The charts made apparent the :ref:`answers
<Answers>` to :ref:`study questions<Questions>`.

.. TODO: picture 2: a picture of experiment setup

Data analysis
=============

In the above :ref:`experiment<Experiment>`, two streams of complementary
sensor-related data were recorded:

1. Sensor distance readings.
2. Video frames with the sensor target's location.

To relate sensor distance readings (1) to sensor target (the metal object),
the target's locations in video frames (2) were :ref:`mapped<Mapping space and
time coordinates>` to estimates of:

3. Sensor target's locations in the sensor X-Y plane (the floor).
4. Distances and angles from each sensor's echo piece to sensor target.

Sensor-to-target distance estimates (4), taken as expected distance readings,
were directly compared to actual sensor distance readings (1), producing
a measure of sensor reading error:

5. *reading error* = sensor's distance reading (1) - expected distance reading (4)

The relationship between sensor distance readings (1) and quantities (3, 4, 5),
were visualized on a number of :ref:`charts<Charts>` and in a :ref:`video
<Video>`, each presenting a different view of the total 3 dimensions:

* sensor distance readings [millimeters, 1D]
* sensor target's location / distance [2D], one of:
   * location [(x, y) coordinates in the sensor plane, 2D]
   * location [(distance, angle) coordinates in the sensor plane, 2D]
   * distance reading error [millimeters, 1D]

Mapping space and time coordinates
----------------------------------

Pixel coordinates to sensor plane coordinates
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

First, sensor target's video frame coordinates in pixels of were mapped to
the sensors X-Y plane (the floor) coordinates in millimeters, via a 2D vector
space `change of basis transformation <https://en.wikipedia.org/wiki/Change_of_basis>`_.

Once the sensor target's location in the sensor plane (the floor) was known,
distance in millimeters and angle (direction) from each sensor's echo piece
to the sensor target was computed. Specifically, a (distance, angle) vector
was computed between two pairs of x-y coordinates in the sensor plane:

* The sensor's echo piece.
* The closest point in the sensor target's contour.

The closest point was determined as the closest point on an ellipse, the shape
of the target round metal object's contour in the sensor plane.

Video time to sensor time
^^^^^^^^^^^^^^^^^^^^^^^^^

TODO

| sensor time
| video time
| frame id
| definitions
| how measured
| how one mapped to the other
 
Source code
===========

`Data analysis source code <src_distance_sensors_analysis_analyze_py_>`_
- produced the :ref:`charts<Charts>`, the :ref:`video<Video>` and the
:ref:`combined source data<Raw data combined>` dump.

Charts
======

.. TODO: for each chart, description of what is presented, axis, scales, colors
.. TODO: explanations of answers to questions,

Target location XY vs distance reading
--------------------------------------

TODO: embed plot

This charts shows complete :ref:`source data<Source data>` with minimal processing.

Each point in the plot corresponds to a single reading of the given sensor.

* The point's X-Y coordinates are the sensor plane (the floor) location of the
  sensor target, that is, of the object that presumably triggered the sensor
  reading (see :ref:`known problems<Known problems and limitations>` though).
* The point's color corresponds to sensor reading value, the distance it
  measured.

Location of each sensor's echo piece is marked with a black cross.

Target location XY vs distance reading, sliced
----------------------------------------------

| TODO: embed plot
| TODO: gray dots

This chart presents the sama data as the first chart. However, readings
are sliced / broken down into 50 mm stripes. A single stripe contains only
those target object's locations that presumably triggered a reading in the
stripe's 50 mm reading range. In other words, if a reading is eg. between
100mm and 150 mm, the extent of possible object's locations is the 100-150 mm
stripe.

Observations (TODO which sensor):

* Distance readings roughly correspond to actual target's distance,
  if the reading is below ca. 1000 mm.
* Many distance readings above ca. 1000 mm are wrong.
* Sensor's angular field of view is ca. 60 degrees, regardless of distance.

Target location XY vs reading error
-----------------------------------

TODO: embed plot

This chart presents almost the sama data as the first chart. The difference
is in points' color.

Here the color corresponds to :ref:`distance reading error<Data analysis>`. Red
points are target's locations where the sensor's reading of distance to target
is off by 50 mm or more. Gray points are target's locations that did not trigger
a sensor reading at all - the reading was an "empty" reading of the stationary
wall.

Note: In the X-Y charts below, the time dimension can be recovered by running
the :ref:`chart-generating code<Source code>` with the ``--annotate=...`` flag.

Distance reading vs reading error distribution
----------------------------------------------

TODO: embed plot

This chart presents the distribution of distance reading error at each distance
reading interval. That is, given a reading, how likely the reading is correct
and how big the error possibly is.

Observations, based on the ``right`` sensor:

* Readings below ca. 1000 mm are correct and accurate, their error below TODO.
* Many readings above ca. are incorrect, their error possibly as high as TODO.
* Many readings of ca. 500 mm are wrong. Possibly, another object was at times
  entering the sensor's field of view, at 500 mm distance, regardless of the
  reference target's current distance.

Target angle vs reading error distribution
------------------------------------------

TODO: embed plot

This chart presents the distribution of distance reading error at each
sensor-to-target angle interval. TODO

Distance reading vs target angle distribution
---------------------------------------------

TODO

Target distance vs distance reading distribution
------------------------------------------------

TODO

Video
=====

TODO: embed video

The video superposes sensor readings on the :ref:`video recording of the
sensor's target object's locations<Sensor target video recording>`

The readings are visualized as:

* concentric arcs radiating from each sensor's echo piece
* glowing of each echo piece
* sliding bars with reading error 

The color with which the readings are visualized corresponds to reading error
or object miss, as in :ref:`Target location XY vs reading error`.

Arc angle span (width) is set explicitly to a fixed value TODO deg, based on
:ref:`answer 2.<answers>`

The video was primarily useful for solving problems with the study itself, by
inspecting relevant video frames. It allowed eg.

* to identify experimental causes of reading error
* to double-check target object's location extracted from the video

The video corresponds to video frame ids [TODO-TODO] in the :ref:`combined
source data<Raw data combined>` dump.

Source data
===========

The source data underlying the study consisted of two streams of complementary
sensor-related data:

1. sensor distance readings - ~9k readings in the overlapping time window
2. video frames with the sensor target's location - TODO frames in the overlapping time window

The overlapping time window, in which both distance readings and video frames
were recorded, was 2 min 17 s.

See :ref:`Target location XY vs distance reading`.

Target object
-------------

The target round metal object's locations were a dense sample of the sensor X-Y
plane's (the floor) area recorded in the video. Also, two types of target's
moves were included in the data:

* slow parallel sweeps, mostly orthogonal to the sensors
* faster random moves, mostly towards / away from the sensors

Raw data combined
-----------------

TODO: embed DataFrame 

Sensor distance readings
------------------------

TODO 

| sensor recording content, format
| actual distance sensor reading, in millimeters

Sensor target video recording
-----------------------------
  
The three sensors had the following spatial arrangement:

# TODO: picture with labels left, front, right

They were driven by a microcontroller running `sensor driver code
<src_controller_drivers_distance_sensor_h_>`_ alone. The code repeatedly fired
and read the sensors, each sensor simultaneously and independently. Readings
were streamed live to a PC, where they were saved.

Timestamps of echo high and low signals were measured with microsecond precision
and collected microseconds after they occured, in an interrupt handler.

Video object detection
----------------------

TODO

| video object extraction
| frames
| interpolation

Video frame generation
======================

TODO

| GIMP automation

Known problems and limitations
******************************

* Artifact distance reading errors, likely due to experimenters' legs entering
  the sensor's field of operation
* Incorrect estimates of sensors target's location and distance, due to:
   * Errors in video object detection
      * Incorrect object location, in particular at frame right (far) edge
        (distance to sensors TODO mm)
      * Missed object in TODO frames
   * Errors in translation from camera plane to sensor plane, due to:
      * Incorrect approximation of 3D space by 2D space, based on an assumption
        that camera and sensor planes are parallel
      * Optical distortions, perspective
   * Errors in interpolation of target's location, from locations at
     video frames immediately preceding and following a reading
   * Errors in mapping video time to sensor time
   * Errors in reading times reported by sensor
* Specific shape and material of sensor target: round and metal

Future work
***********

* Remove artifact distance reading errors by fixing the experimental procedure
* Fix estimates of sensor targets' location and distance
* Analyze a single sensor, free of interferences with other sensors
* Analyze multiple sensors, arranged spatially without overlap
* Build and evaluate a complete object detection system from combined sensors
* Confirm that sensor reading frequency is as high as possible or remove the cause
  of slowdown

.. TODO: src directive

.. _src: https://github.com/wiktortomczak/sumo

.. _src_distance_sensors_analysis_analyze_py: https://github.com/wiktortomczak/sumo/distance_sensors/analysis/analyze.py

.. _src_controller_drivers_distance_sensor_h: https://github.com/wiktortomczak/sumo/controller/drivers/distance_sensor.h
