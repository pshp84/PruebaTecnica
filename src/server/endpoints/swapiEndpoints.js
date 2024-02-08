const _isWookieeFormat = (req) => {
    if (req.query.format && req.query.format == 'wookiee') {
        return true;
    }
    return false;
};

const applySwapiEndpoints = (server, app) => {
    const getPeopleById = (peopleId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let record = await app.db.swPeople.findOne({
                    where: {
                        id: peopleId,
                    },
                });

                if (!record) {
                    record = await app.swapiFunctions.genericRequest(`https://swapi.dev/api/people/${peopleId}`, 'GET', null, false);
                    if (!record.homeworld) {
                        reject({
                            code: 404,
                            message: 'People with provided ID not found',
                        });
                    }

                    const homeWorldDetails = await app.swapiFunctions.genericRequest(record.homeworld, 'GET', null, false);
                    record.homeworldName = homeWorldDetails.name;
                    record.homeworldId = record.homeworld.split('/').filter(Boolean).pop();
                }

                resolve({
                    name: record.name,
                    mass: record.mass,
                    height: record.height,
                    homeworldName: record.homeworldName,
                    homeworldId: record.homeworldId,
                });
            } catch (error) {
                reject({
                    code: 422,
                    message: error.message,
                });
            }
        });
    };

    const getPlanetById = (planetId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let record = await app.db.swPlanet.findOne({
                    where: {
                        id: planetId,
                    },
                });

                if (!record) {
                    record = await app.swapiFunctions.genericRequest(`https://swapi.dev/api/planets/${planetId}`, 'GET', null, false);
                    if (!record.name) {
                        reject({
                            code: 404,
                            message: 'Planet with provided ID not found',
                        });
                    }
                }

                resolve({
                    name: record.name,
                    gravity: record.gravity,
                });
            } catch (error) {
                reject({
                    code: 422,
                    message: error.message,
                });
            }
        });
    };

    server.get('/hfswapi/test', async (req, res) => {
        const data = await app.swapiFunctions.genericRequest('https://swapi.dev/api/', 'GET', null, true);
        res.send(data);
    });

    server.get('/hfswapi/getPeople/:id', async (req, res) => {
        try {
            const data = await getPeopleById(req.params.id);
            res.send(data);
        } catch (error) {
            res.status(error.code).send({
                message: error.message,
            });
        }
    });

    server.get('/hfswapi/getPlanet/:id', async (req, res) => {
        try {
            const data = await getPlanetById(req.params.id);
            res.send(data);
        } catch (error) {
            res.status(error.code).send({
                message: error.message,
            });
        }
    });

    server.get('/hfswapi/getWeightOnPlanetRandom', async (req, res) => {
        res.sendStatus(501);
    });

    server.get('/hfswapi/getLogs', async (req, res) => {
        const data = await app.db.logging.findAll();
        res.send(data);
    });
};

module.exports = applySwapiEndpoints;
