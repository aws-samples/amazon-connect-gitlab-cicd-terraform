'use strict';
const fs = require('fs');
const fsExtra = require('fs-extra');
const shell = require('shelljs');

const dependencyFileName = 'required-modules.txt';
const fileEncoding = 'UTF-8';
const nodeDirInLambda = 'nodejs';
const nodeModulesDir = 'node_modules';

const findModuleDependencies = async (nodeModulesDir, moduleName, targetDir) => {

	let returnArray = [];
	let packageJsonFile = nodeModulesDir.concat('/', moduleName, '/', 'package.json');
	let rawdata = fs.readFileSync(packageJsonFile);
	let packageJson = JSON.parse(rawdata);
	// console.log("packageJson: ", packageJson);
	let dependencies = packageJson.dependencies || {};
	// console.log("dependencies: ", dependencies);

	for (let dependency of Object.keys(dependencies)) {
		let returned = await findModuleDependencies(nodeModulesDir, dependency, targetDir);
		returnArray = returnArray.concat(returned);
	}

	// add the original module into the returned array
	returnArray.push(moduleName);
	return returnArray;
};

const processDependencyFile = async (file) => {

	// convert windows dir seperator to linux
	file = file.replace(/\\/g, '/');
	console.log('processDependencyFile: ' + file);

	// set the target directory
	const targetDir = 'bin/'.concat(file).replace(dependencyFileName, '');
	// console.log(targetDir);

	const targetModulesDir = `${targetDir}/`.concat(nodeDirInLambda, '/', nodeModulesDir);

	// delete the existing dir - if it exists
	if (fs.existsSync(targetModulesDir)) {
		// console.log('Deleting existing modules directory');

		// delete directory recursively
		fs.rmdirSync(targetModulesDir, { recursive: true });
	}

	// create the new one
	shell.mkdir('-p', './'.concat(targetModulesDir));

	// read each line of the dependencies and copy from main modules dir to compiled code dir
	const fileText = fs.readFileSync(file, fileEncoding);

	// split the contents by new line
	const dependencies = fileText.split(/\r?\n/);

	let copyPromises = [];
	console.log(`copyDependencies: Looking for nested dependencies in [${file}] ...`);
	for (let dependency of dependencies) {
		// ignore empty lines or it tries to copy ALL the node modules
		if (!dependency == '') {
			copyPromises.push(
				findModuleDependencies(nodeModulesDir, dependency, targetModulesDir)
			);
		}
	}

	// wait for all dependency trees to be calculated
	let depsArray = await Promise.all(copyPromises);

	// combine the individual arrays into a final one
	let finalArray = [];
	for (let depArray of depsArray) {
		finalArray = finalArray.concat(depArray);
	}

	// remove duplicate items
	let uniquePackages = Array.from(new Set(finalArray));
	console.log(`copyDependencies: Copying [${uniquePackages.length}] module(s) for [${file}]`);
	
	let copyPromiseArray = [];
	for (let pkg of uniquePackages) {
		// start copying and add the promise to the array
		// console.log("copy from ", nodeModulesDir.concat('/', pkg), " to ", targetModulesDir.concat('/', pkg))
		copyPromiseArray.push(fsExtra.copy(
			nodeModulesDir.concat('/', pkg),
			targetModulesDir.concat('/', pkg)
		));
	}

	// wait for all copy promises to be done
	await Promise.all(copyPromiseArray);
	const msg = `Done with modules for [${file}]`;
	console.log(`copyDependencies: ${msg}`);
	return msg;
};

const processLayerFile = async (oldPath) => {

	// convert windows dir seperator to linux
	console.log(`processLayerFile: oldPath = [${oldPath}]`);
	oldPath = oldPath.replace(/\\/g, '/');

	// split path
	const idx = oldPath.indexOf('-layer/') + 7;
	
	const head = oldPath.substring(0, idx);
	console.log(`processLayerFile: head [${head}]`);
	
	const tail = oldPath.substring(idx);
	console.log(`processLayerFile: tail [${tail}]`);

	const layerDir = tail.substring(0, tail.indexOf('-layer/') + 6);
	console.log(`processLayerFile: layerDir [${layerDir}]`);

	const nodejsPath = `${head}${nodeDirInLambda}`;
	const modulesPath = `${nodejsPath}/${nodeModulesDir}`;
	const layerModulePath = `${modulesPath}/${layerDir}`;

	// create nodejs directory if it doesn't exist
	if(!fs.existsSync(layerModulePath)) {
		shell.mkdir('-p', layerModulePath);
		console.log(`processLayerFile: Made dir [${layerModulePath}]`);
	}

	// move file
	const newPath = `${modulesPath}/${tail}`;
	console.log(`processLayerFile: newPath = [${newPath}]`);

	fs.rename(oldPath, newPath, (async err => {

		if (err) throw err
				
		const oldLayerDir = `${head}${layerDir}`;
		if(fs.existsSync(oldLayerDir)) {
			const files = fs.readdirSync(oldLayerDir);
			console.log(`processLayerFile: [${oldLayerDir}] has ${files.length} files`);
			if(files.length < 1) {
				fs.rmdir(oldLayerDir, { recursive: true, force: true }, (err => {
					if(err) throw err;
					console.log(`processLayerFile: Removed [${oldLayerDir}]`);
				}));				
			}
		}
		
	}));

}

const getAllFiles = function (dirPath, arrayOfFiles) {

	let files = fs.readdirSync(dirPath);

	arrayOfFiles = arrayOfFiles || [];
	files.forEach(function (file) {
		if (fs.statSync(dirPath + '/' + file).isDirectory()) {
			arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
		} else {
			arrayOfFiles.push(dirPath.concat('/', file));
		}
	});
	
	return arrayOfFiles;
};

const getAllLayerFiles = (dirPath, layerFiles = []) => {

	if(dirPath.startsWith('bin/test')
		|| dirPath.endsWith(nodeDirInLambda)
		|| dirPath.endsWith(nodeModulesDir)) {
		return layerFiles;
	}

	//console.log(`getAllLayerFiles: [${dirPath}]`);

	let files = fs.readdirSync(dirPath);

	files.forEach((file) => {
		if (fs.statSync(dirPath + '/' + file).isDirectory()) {
			layerFiles = getAllLayerFiles(dirPath + '/' + file, layerFiles);
		} else {
			if(dirPath.indexOf('layers') < 0 || dirPath.indexOf('-layer') < 0) return;
			const fileName = `${dirPath}/${file}`;
			//console.log(`getAllLayerFiles: [${fileName}]`);
			layerFiles.push(fileName);
		}
	});
	
	return layerFiles;
}

const copyDependencies = async (startDir) => {

	console.log('*********************************************************');
	console.log('* COPYING PACKAGE DEPENDENCIES FROM MAIN NODE_MODULES.  *');
	console.log('* GOAL: MAINTAIN CONSISTENCY ACROSS DEPLOYED ARTIFACTS. *');
	console.log('*********************************************************');

	console.log(`copyDependencies: Checking for dependencies within [${startDir}] ...`);

	let fileProcessedPromises = [];

	let filesArray = getAllFiles(startDir);
	for (let fileName of filesArray) {
		if (fileName.endsWith(dependencyFileName)) {
			fileProcessedPromises.push(processDependencyFile(fileName));
		}
	}

	await Promise.all(fileProcessedPromises);

	const layerFiles = getAllLayerFiles('bin');
	console.log(`copyDependencies: Layer files =`, layerFiles);
	for (let f of layerFiles) {
		await processLayerFile(f);
	}

	const msg = `Done with [${startDir}]`;
  	console.log(`copyDependencies: ${msg}`); 
	return msg;
};

module.exports = { copyDependencies };

// execute with command line param or default id not provided
if (require.main === module) {
	copyDependencies(process.argv[2] || './lib');
}
