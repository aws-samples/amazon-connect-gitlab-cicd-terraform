const { sep } = require('path');
const {
    existsSync,
    mkdirSync,
    readdirSync,
    rmdirSync,
    statSync,
    unlinkSync,
    writeFileSync
} = require('fs');

const isWindows = sep === '\\';

const mkdir = (path) => {

    if(existsSync(path)) {
        if(!statSync(path).isDirectory()) {
            throw new Error(`[${path}] exists, but is not a directory!`);
        }
        return;
    }

    mkdirSync(path);
}

const rmdir = (path, force = true) => {

    if(!existsSync(path)) return;

    const files = readdirSync(path);
    if(files.length < 1) {
        rmdirSync(path);
        return;
    }

    if(!force) throw new Error(`[${path}] not empty (use force = true to delete recursively)`);

    for(const file of files) {
        const filePath = `${path}/${file}`;
        statSync(filePath).isDirectory()
            ? rmdir(filePath) // recursive call
            : unlinkSync(filePath);        
    } // for(const file ...

};

const rm = (path) => {
    if(!existsSync(path)) return;
    unlinkSync(filePath);
};

const createDirectory = (path) => {

    if(typeof path !== 'string' || path.length < 1) throw new Error('Directory path required!');
    path = path.endsWith(sep) ? path.substring(0, path.length - 1) : path;
    const tokens = path.split(sep);    
    let runningPath = isWindows ? `${tokens[0]}${sep}` : sep;

    for(let i = isWindows ? 1 : 0; i < tokens.length; i++) {
        runningPath += `${sep}${tokens[i]}`;
        if(existsSync(runningPath)) continue;
        mkdirSync(runningPath);
    }

};

const writeFile = (path, fileName, content = '') => {
    createDirectory(path);
    const filePath = path.endsWith(sep) ? `${path}${fileName}` : `${path}${sep}${fileName}`;
    writeFileSync(filePath, content);
    return filePath;
};

exports.mkdir = mkdir;
exports.rmdir = rmdir;
exports.rm = rm;
exports.createDirectory = createDirectory;
exports.writeFile = writeFile;
