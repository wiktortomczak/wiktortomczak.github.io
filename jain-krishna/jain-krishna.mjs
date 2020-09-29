
import {JainKrishnaModelFactory} from 'https://tomczak.xyz/jain-krishna/model.mjs';
import JainKrishnaModelBrowser from 'https://tomczak.xyz/jain-krishna/model-browser.mjs';


function main() {
  JainKrishnaModelBrowser.createAndRender(new JainKrishnaModelFactory());
}

window.onload = main;
