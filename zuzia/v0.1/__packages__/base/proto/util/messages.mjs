
export default class Messages {

  static findByType(messageOrContainer, messageCls, messagesOut) {
    messagesOut = messagesOut || [];
    messageOrContainer.forEachNestedEntry((value, _, fieldDescriptor) => {
      if (value instanceof messageCls && !fieldDescriptor.isReference) {
        messagesOut.push(value);
      }
    });
    return messagesOut;
  }
}
