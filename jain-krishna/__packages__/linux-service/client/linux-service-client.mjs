
const d3 = window.d3;

import Fetch, {FetchResponse} from 'https://tomczak.xyz/jain-krishna/__packages__/linux-service/client/fetch.mjs';

/**
 * LinuxService JavaScript client.
 */
export default class LinuxServiceClient {

  /**
   * Runs given Linux command (executable) in the service, after extracting
   * bundled files, possibly the executable itself.
   *
   * @param {!Array<!String>} command Linux command line, executable and
   *   arguments. The command should refer to the executable, if uploaded,
   *   relative to current directory (prefixed with './'), eg.
   *   ['./my_script.sh', 'arg1'].
   * @param {!Array<!String>} fileURIs URIs of files to bundle in the request.
   *   The files are fetched by the client then bundled.
   * @return {!FetchResponse} The command's stdout.
   */
  static UploadAndExecute(command, fileURIs) {
    return FetchResponse.fromPromise(
      this._buildUploadAndExecuteRequest(command, fileURIs)
        .then(request => Fetch.post(
          LinuxServiceClient.serviceUrl + '/UploadAndExecute',
          JSON.stringify(request), 'application/json')));
  }

  static _buildUploadAndExecuteRequest(command, fileURIs) {
    return this._getFiles(fileURIs).then(filenameContentList => ({
      command: command,
      files: filenameContentList.map(([filename, content]) => (
        {filename, content}
      ))
    }));
  }

  static _getFiles(fileURIs) {
    return Promise.all(fileURIs.map(fileURI => (
      Fetch.get(fileURI).getText())))
      .then(fileContentList => d3.zip(
        fileURIs.map(LinuxServiceClient._fileURIToFilename),
        fileContentList));
  }

  static _fileURIToFilename(fileURI) {
    return fileURI;  // TODO
  }
}

LinuxServiceClient.serviceUrl =
  window.LINUX_SERVICE || 'https://wiktor.pythonanywhere.com/LinuxService';
