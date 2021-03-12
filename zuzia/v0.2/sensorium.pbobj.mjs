// Auto-generated.
import {createObjectClassesFromFileDescriptorSetJson} from '/zuzia/v0.2/__packages__/base/proto/object/object.mjs';

// FileDescriptorSet with proto/object/options.proto annotations.
const fileDescriptorSetJson = {
  "file": [
    {
      "messageType": [
        {
          "name": "Sensorium",
          "field": [
            {
              "name": "exercise_blocks",
              "jsonName": "exerciseBlocks",
              "number": 1,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlocks"
            },
            {
              "name": "patient",
              "jsonName": "patient",
              "number": 2,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".Patient"
            },
            {
              "name": "today",
              "jsonName": "today",
              "number": 3,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".Date"
            },
            {
              "name": "sensor",
              "jsonName": "sensor",
              "number": 4,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".Sensor"
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [

              ]
            }
          }
        },
        {
          "name": "Patient",
          "field": [
            {
              "name": "sessions",
              "jsonName": "sessions",
              "number": 1,
              "label": "LABEL_REPEATED",
              "type": "TYPE_MESSAGE",
              "typeName": ".Session"
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [

              ]
            }
          }
        },
        {
          "name": "Session",
          "field": [
            {
              "name": "date",
              "jsonName": "date",
              "number": 1,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".Date"
            },
            {
              "name": "type",
              "jsonName": "type",
              "number": 2,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_INT64"
            },
            {
              "name": "exercises_constant_press",
              "jsonName": "exercisesConstantPress",
              "number": 3,
              "label": "LABEL_REPEATED",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlockConstantPress.ExerciseAndResponse"
            },
            {
              "name": "exercises_variable_press",
              "jsonName": "exercisesVariablePress",
              "number": 4,
              "label": "LABEL_REPEATED",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlockVariablePress.ExerciseAndResponse"
            },
            {
              "name": "exercises_utterance",
              "jsonName": "exercisesUtterance",
              "number": 5,
              "label": "LABEL_REPEATED",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlockUtterance.ExerciseAndResponse"
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [
                {
                  "methodName": "StartSession",
                  "methodNameJson": "startSession"
                }
              ]
            }
          }
        },
        {
          "name": "ExerciseBlocks",
          "field": [
            {
              "name": "constant_press",
              "jsonName": "constantPress",
              "number": 1,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlockConstantPress"
            },
            {
              "name": "variable_press",
              "jsonName": "variablePress",
              "number": 2,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlockVariablePress"
            },
            {
              "name": "utterance",
              "jsonName": "utterance",
              "number": 3,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlockUtterance"
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [

              ]
            }
          }
        },
        {
          "name": "ExerciseBlockConstantPress",
          "field": [
            {
              "name": "exercises",
              "jsonName": "exercises",
              "number": 1,
              "label": "LABEL_REPEATED",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlockConstantPress.Exercise"
            },
            {
              "name": "block_instruction",
              "jsonName": "blockInstruction",
              "number": 2,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_STRING"
            },
            {
              "name": "exercise_instruction",
              "jsonName": "exerciseInstruction",
              "number": 3,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_STRING"
            }
          ],
          "nestedType": [
            {
              "name": "Exercise",
              "field": [
                {
                  "name": "press",
                  "jsonName": "press",
                  "number": 1,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_FLOAT"
                }
              ]
            },
            {
              "name": "ExerciseAndResponse",
              "field": [
                {
                  "name": "exercise",
                  "jsonName": "exercise",
                  "number": 1,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".ExerciseBlockConstantPress.Exercise",
                  "options": {
                    "[protoExt.field]": {
                      "reference": true
                    }
                  }
                },
                {
                  "name": "response",
                  "jsonName": "response",
                  "number": 2,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".Recording"
                },
                {
                  "name": "score",
                  "jsonName": "score",
                  "number": 3,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_FLOAT"
                }
              ],
              "options": {
                "[protoObject.object]": {
                  "rpcMethod": [
                    {
                      "methodName": "Reset",
                      "methodNameJson": "reset"
                    }
                  ]
                }
              }
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [

              ]
            }
          }
        },
        {
          "name": "ExerciseBlockVariablePress",
          "field": [
            {
              "name": "exercises",
              "jsonName": "exercises",
              "number": 1,
              "label": "LABEL_REPEATED",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlockVariablePress.Exercise"
            },
            {
              "name": "block_instruction",
              "jsonName": "blockInstruction",
              "number": 2,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_STRING"
            },
            {
              "name": "exercise_instruction",
              "jsonName": "exerciseInstruction",
              "number": 3,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_STRING"
            }
          ],
          "nestedType": [
            {
              "name": "Exercise",
              "field": [
                {
                  "name": "recording",
                  "jsonName": "recording",
                  "number": 1,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".Recording"
                }
              ]
            },
            {
              "name": "ExerciseAndResponse",
              "field": [
                {
                  "name": "exercise",
                  "jsonName": "exercise",
                  "number": 1,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".ExerciseBlockVariablePress.Exercise",
                  "options": {
                    "[protoExt.field]": {
                      "reference": true
                    }
                  }
                },
                {
                  "name": "response",
                  "jsonName": "response",
                  "number": 2,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".Recording"
                },
                {
                  "name": "score",
                  "jsonName": "score",
                  "number": 3,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_FLOAT"
                }
              ],
              "options": {
                "[protoObject.object]": {
                  "rpcMethod": [
                    {
                      "methodName": "Reset",
                      "methodNameJson": "reset"
                    }
                  ]
                }
              }
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [

              ]
            }
          }
        },
        {
          "name": "ExerciseBlockUtterance",
          "field": [
            {
              "name": "exercises",
              "jsonName": "exercises",
              "number": 1,
              "label": "LABEL_REPEATED",
              "type": "TYPE_MESSAGE",
              "typeName": ".ExerciseBlockUtterance.Exercise"
            },
            {
              "name": "block_instruction",
              "jsonName": "blockInstruction",
              "number": 2,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_STRING"
            },
            {
              "name": "exercise_instruction",
              "jsonName": "exerciseInstruction",
              "number": 3,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_STRING"
            }
          ],
          "nestedType": [
            {
              "name": "Exercise",
              "field": [
                {
                  "name": "recording",
                  "jsonName": "recording",
                  "number": 1,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".Recording"
                },
                {
                  "name": "tags",
                  "jsonName": "tags",
                  "number": 2,
                  "label": "LABEL_REPEATED",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".Tag"
                }
              ]
            },
            {
              "name": "ExerciseAndResponse",
              "field": [
                {
                  "name": "exercise",
                  "jsonName": "exercise",
                  "number": 1,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".ExerciseBlockUtterance.Exercise",
                  "options": {
                    "[protoExt.field]": {
                      "reference": true
                    }
                  }
                },
                {
                  "name": "response",
                  "jsonName": "response",
                  "number": 2,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".Recording"
                },
                {
                  "name": "score",
                  "jsonName": "score",
                  "number": 3,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_FLOAT"
                }
              ],
              "options": {
                "[protoObject.object]": {
                  "rpcMethod": [
                    {
                      "methodName": "Reset",
                      "methodNameJson": "reset"
                    }
                  ]
                }
              }
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [

              ]
            }
          }
        },
        {
          "name": "Sensor",
          "field": [
            {
              "name": "last_reading",
              "jsonName": "lastReading",
              "number": 1,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".Reading"
            },
            {
              "name": "recording",
              "jsonName": "recording",
              "number": 2,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_MESSAGE",
              "typeName": ".Recording",
              "options": {
                "[protoExt.field]": {
                  "reference": true
                }
              }
            }
          ],
          "nestedType": [
            {
              "name": "StartRecordingRequest",
              "field": [
                {
                  "name": "recording",
                  "jsonName": "recording",
                  "number": 1,
                  "label": "LABEL_OPTIONAL",
                  "type": "TYPE_MESSAGE",
                  "typeName": ".Recording",
                  "options": {
                    "[protoExt.field]": {
                      "reference": true
                    }
                  }
                }
              ]
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [
                {
                  "methodName": "StartRecording",
                  "methodNameJson": "startRecording",
                  "requestTypeName": ".Sensor.StartRecordingRequest"
                },
                {
                  "methodName": "StopRecording",
                  "methodNameJson": "stopRecording"
                }
              ]
            }
          }
        },
        {
          "name": "Recording",
          "field": [
            {
              "name": "readings",
              "jsonName": "readings",
              "number": 1,
              "label": "LABEL_REPEATED",
              "type": "TYPE_MESSAGE",
              "typeName": ".Reading"
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [

              ]
            }
          }
        },
        {
          "name": "Reading",
          "field": [
            {
              "name": "offset_msec",
              "jsonName": "offsetMsec",
              "number": 1,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_INT64"
            },
            {
              "name": "value",
              "jsonName": "value",
              "number": 2,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_FLOAT"
            }
          ]
        },
        {
          "name": "Tag",
          "field": [
            {
              "name": "offset_msec",
              "jsonName": "offsetMsec",
              "number": 1,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_INT64"
            },
            {
              "name": "tag",
              "jsonName": "tag",
              "number": 2,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_STRING"
            }
          ]
        },
        {
          "name": "Date",
          "field": [
            {
              "name": "date_str",
              "jsonName": "dateStr",
              "number": 1,
              "label": "LABEL_OPTIONAL",
              "type": "TYPE_STRING"
            }
          ],
          "options": {
            "[protoObject.object]": {
              "rpcMethod": [

              ]
            }
          }
        }
      ]
    }
  ]
};

const objectClasses =
  createObjectClassesFromFileDescriptorSetJson(fileDescriptorSetJson);
export default objectClasses;

self.protoObject = self.protoObject || {};
self.protoObject.Sensorium = objectClasses['.Sensorium'];
self.protoObject.Patient = objectClasses['.Patient'];
self.protoObject.Session = objectClasses['.Session'];
self.protoObject.ExerciseBlocks = objectClasses['.ExerciseBlocks'];
self.protoObject.ExerciseBlockConstantPress = objectClasses['.ExerciseBlockConstantPress'];
self.protoObject.ExerciseBlockVariablePress = objectClasses['.ExerciseBlockVariablePress'];
self.protoObject.ExerciseBlockUtterance = objectClasses['.ExerciseBlockUtterance'];
self.protoObject.Sensor = objectClasses['.Sensor'];
self.protoObject.Recording = objectClasses['.Recording'];
self.protoObject.Date = objectClasses['.Date'];
