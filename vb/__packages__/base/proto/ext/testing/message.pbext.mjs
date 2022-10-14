
import {createMessageClassesFromFileDescriptorSetJson, BoundaryMessage, BoundaryContainer} from 'https://wiktortomczak.github.io/vb/__packages__/base/proto/ext/message2.mjs';

// base $ proto/ext/compile.sh proto/ext/testing/message.proto
export const messageFileDescriptorSetJson = {  // FileDescriptorSet
 "file": [
  {
   "name": "message.proto",
   "package": "test",
   "messageType": [
    {
     "name": "Message",
     "field": [
      {
       "name": "i",
       "number": 1,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_INT64",
       "jsonName": "i"
      },
      {
       "name": "li",
       "number": 2,
       "label": "LABEL_REPEATED",
       "type": "TYPE_INT64",
       "jsonName": "li"
      },
      {
       "name": "mi",
       "number": 3,
       "label": "LABEL_REPEATED",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Message.MiEntry",
       "jsonName": "mi"
      },
      {
       "name": "m",
       "number": 4,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Message",
       "jsonName": "m"
      },
      {
       "name": "lm",
       "number": 5,
       "label": "LABEL_REPEATED",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Message",
       "jsonName": "lm"
      },
      {
       "name": "mm",
       "number": 6,
       "label": "LABEL_REPEATED",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Message.MmEntry",
       "jsonName": "mm"
      },
      {
       "name": "rm",
       "number": 7,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Message",
       "jsonName": "rm",
       "options": {
        "[protoExt.field]": {
         "reference": true
        }
       }
      },
      {
       "name": "lrm",
       "number": 8,
       "label": "LABEL_REPEATED",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Message",
       "jsonName": "lrm",
       "options": {
        "[protoExt.field]": {
         "reference": true
        }
       }
      },
      {
       "name": "mrm",
       "number": 9,
       "label": "LABEL_REPEATED",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Message.MmEntry",
       "jsonName": "mrm",
       "options": {
        "[protoExt.field]": {
         "reference": true
        }
       }
      },
      {
       "name": "s",
       "number": 10,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_STRING",
       "jsonName": "s"
      }
     ],
     "nestedType": [
      {
       "name": "MiEntry",
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
         "type": "TYPE_INT64",
         "jsonName": "value"
        }
       ],
       "options": {
        "mapEntry": true
       }
      },
      {
       "name": "MmEntry",
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
         "typeName": ".test.Message",
         "jsonName": "value"
        }
       ],
       "options": {
        "mapEntry": true
       }
      }
     ],
     "options": {
      "partitionRoot": true
     }
    },
    {
     "name": "Root",
     "field": [
      {
       "name": "m",
       "number": 1,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Message",
       "jsonName": "m"
      },
      {
       "name": "mm",
       "number": 2,
       "label": "LABEL_REPEATED",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Root.MmEntry",
       "jsonName": "mm"
      },
      {
       "name": "lm",
       "number": 3,
       "label": "LABEL_REPEATED",
       "type": "TYPE_MESSAGE",
       "typeName": ".test.Message",
       "jsonName": "lm"
      },
      {
       "name": "i",
       "number": 4,
       "label": "LABEL_OPTIONAL",
       "type": "TYPE_INT64",
       "jsonName": "i"
      }
     ],
     "nestedType": [
      {
       "name": "MmEntry",
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
         "typeName": ".test.Message",
         "jsonName": "value"
        }
       ],
       "options": {
        "mapEntry": true
       }
      }
     ]
    }
   ]
  }
 ]
};

const messageClasses =
  createMessageClassesFromFileDescriptorSetJson(messageFileDescriptorSetJson);
export default messageClasses;

// TODO: Compute automatically.
messageClasses['.test.Message'].partitionBoundary = {
  m: BoundaryMessage, lm: BoundaryContainer, mm: BoundaryContainer
};

self.proto = self.proto || {};
self.proto.test = self.proto.test || {};
self.proto.test.Message = messageClasses['.test.Message'];
self.proto.test.Root = messageClasses['.test.Root'];
