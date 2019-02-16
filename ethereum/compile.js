const path = require('path');
const solc = require('solc');
//Gives access to file system and extra functionalities (module)
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
//remove the build folder
fs.removeSync(buildPath);

const campaignPath = path.resolve(__dirname, 'contracts', 'Campaign.sol');

const source = fs.readFileSync(campaignPath, 'utf8');

//Need to write the outputs of this to two seperate files
const output = solc.compile(source, 1).contracts;

//Recreate build folder
fs.ensureDirSync(buildPath);


for (let contract in output) {
  fs.outputJsonSync(
    path.resolve(buildPath, contract.replace(':','') + '.json'),
    output[contract]
  );
}
