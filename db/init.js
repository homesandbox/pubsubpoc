const cp = require('node:child_process');
const postgres = require('postgres');

const containerName = 'pubsubpoc';
const dbName = 'pubsubpoc';
const dbPort = 5432;
const userAndPass = 'postgres';
const runDbContainerCMD = `docker run --name ${containerName} -dp ${dbPort}:${dbPort} -e POSTGRES_USER=${userAndPass} -e POSTGRES_PASSWORD=${userAndPass} -e POSTGRES_DB=${dbName} postgis/postgis:15-3.4-alpine`;

console.log('Container is up. ID:')
cp.execSync(runDbContainerCMD, {stdio: 'inherit'});

const connection = postgres(`postgres://${userAndPass}:${userAndPass}@localhost:${dbPort}/${dbName}`);

// its a one time thing, it will fail if ran twice or more.
setTimeout(async () => {
	const isDone = await connection.file('db.sql');
	if (isDone) {
		console.info('DB is up. Seeds are loaded');
	} else {
		pls();
	}
	connection.end();
}, 5000);
