
import {createObjectClassesFromFileDescriptorSetJson} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/object/object.mjs';

// base $ proto/object/compile.sh proto/object/testing/game_service.protoobj
// FileDescriptorSet with proto_object annotations.
const fileDescriptorSetJson = {
 "file": [
  {
   "name": "proto/object/testing/game_service.proto",
   "package": "test",
   "dependency": [
    "proto/ext/options.proto",
    "proto/object/options.proto"
   ],
   "messageType": [
    {
     "name": "GameService",
     "field": [
      {
       "name": "player",
       "number": 1,
       "label": "LABEL_REPEATED",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.GameService.PlayerEntry",
       "jsonName": "player"
      },
      {
       "name": "game",
       "number": 2,
       "label": "LABEL_REPEATED",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.GameService.GameEntry",
       "jsonName": "game"
      }
     ],
     "nestedType": [
      {
       "name": "PlayerEntry",
       "field": [
        {
         "name": "key",
         "number": 1,
         "label": "LABEL_OPTIONAL",
         "type": "TYPE_STRING",
         "jsonName": "key"
        },
        {
         "name": "value",
         "number": 2,
         "label": "LABEL_OPTIONAL",
         "type": "TYPE_MESSAGE",
         "typeName": ".test.Player",
         "jsonName": "value"
        }
       ],
       "options": {
        "mapEntry": true
       }
      },
      {
       "name": "GameEntry",
       "field": [
        {
         "name": "key",
         "number": 1,
         "label": "LABEL_OPTIONAL",
         "type": "TYPE_STRING",
         "jsonName": "key"
        },
        {
         "name": "value",
         "number": 2,
         "label": "LABEL_OPTIONAL",
         "type": "TYPE_MESSAGE",
         "typeName": ".test.Game",
         "jsonName": "value"
        }
       ],
       "options": {
        "mapEntry": true
       }
      },
      {
       "name": "AddPlayerRequest",
       "field": [
        {
         "name": "id",
         "number": 1,
         "label": "LABEL_OPTIONAL",
         "type": "TYPE_STRING",
         "jsonName": "id"
        },
        {
         "name": "name",
         "number": 2,
         "label": "LABEL_OPTIONAL",
         "type": "TYPE_STRING",
         "jsonName": "name"
        }
       ]
      },
      {
       "name": "CreateGameRequest",
       "field": [
        {
         "name": "player1",
         "number": 1,
         "label": "LABEL_OPTIONAL",
         "type": "TYPE_MESSAGE",
         "typeName": ".test.Player",
         "options": {
          "[protoExt.field]": {
           "reference": true
          }
         },
         "jsonName": "player1"
        },
        {
         "name": "player2",
         "number": 2,
         "label": "LABEL_OPTIONAL",
         "type": "TYPE_MESSAGE",
         "typeName": ".test.Player",
         "options": {
          "[protoExt.field]": {
           "reference": true
          }
         },
         "jsonName": "player2"
        }
       ]
      }
     ],
     "options": {
      "[protoObject.rpcMethod]": [
       {
        "methodName": "AddPlayer",
        "methodNameJson": "addPlayer",
        "requestTypeName": ".test.GameService.AddPlayerRequest"
       },
       {
        "methodName": "CreateGame",
        "methodNameJson": "createGame",
        "requestTypeName": ".test.GameService.CreateGameRequest"
       }
      ]
     }
    },
    {
     "name": "Player",
     "field": [
      {
       "name": "id",
       "number": 1,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_STRING",
       "jsonName": "id"
      },
      {
       "name": "name",
       "number": 2,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_STRING",
       "jsonName": "name"
      }
     ],
     "options": {
      "[protoObject.rpcMethod]": [
       {
        "methodName": "Remove",
        "methodNameJson": "remove"
       }
      ]
     }
    },
    {
     "name": "Game",
     "field": [
      {
       "name": "id",
       "number": 1,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_STRING",
       "jsonName": "id"
      },
      {
       "name": "player1",
       "number": 2,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Player",
       "options": {
        "[protoExt.field]": {
         "reference": true
        }
       },
       "jsonName": "player1"
      },
      {
       "name": "player2",
       "number": 3,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Player",
       "options": {
        "[protoExt.field]": {
         "reference": true
        }
       },
       "jsonName": "player2"
      },
      {
       "name": "active_player",
       "number": 4,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Player",
       "options": {
        "[protoExt.field]": {
         "reference": true
        }
       },
       "jsonName": "activePlayer"
      }
     ],
     "nestedType": [
      {
       "name": "MoveRequest",
       "field": [
        {
         "name": "player",
         "number": 1,
         "label": "LABEL_OPTIONAL",
         "type": "TYPE_MESSAGE",
         "typeName": ".test.Player",
         "options": {
          "[protoExt.field]": {
           "reference": true
          }
         },
         "jsonName": "player"
        }
       ]
      }
     ],
     "options": {
      "[protoObject.rpcMethod]": [
       {
        "methodName": "Move",
        "methodNameJson": "move",
        "requestTypeName": ".test.Game.MoveRequest"
       }
      ]
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
self.protoObject.test = self.protoObject.test || {};
self.protoObject.test.GameService = objectClasses['.test.GameService'];
self.protoObject.test.Player = objectClasses['.test.Player'];
self.protoObject.test.Game = objectClasses['.test.Game'];
