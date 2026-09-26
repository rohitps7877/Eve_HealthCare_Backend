import prisma from "../config/db.js";

const createTest = async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || price === undefined) {
            return res.status(400).send("Name and price are required");
        }

        if (typeof name !== "string" || typeof price !== "number") {
            return res.status(400).send("Name must be a string and price must be a number");
        }

        if (price <= 0) {
            return res.status(400).send("Price must be greater than 0");
        }

        const test = await prisma.diagnosticTest.create({
            data: {
                name: name,
                price: price
            }
        });

        console.log(`Diagnostic test created: ${test.id}`);

        res.status(201).json(test);

    } catch (err) {
        console.log("Create test error:", err);
        res.status(500).send("Internal server error");
    }
};

const createCentre = async (req, res) => {
    try {
        const { name, location } = req.body;

        if (!name || !location) {
            return res.status(400).send("Name and location are required");
        }

        const centre = await prisma.diagnosticCentre.create({
            data: {
                name: name,
                location: location
            }
        });

        console.log(`Diagnostic centre created: ${centre.id}`);

        res.status(201).json(centre);

    } catch (err) {
        console.log("Create centre error:", err);
        res.status(500).send("Internal server error");
    }
};

const addTestToCentre = async (req, res) => {
    try {
        const centreId = Number(req.params.centreId);
        const testId = Number(req.params.testId);

        const centre = await prisma.diagnosticCentre.findUnique({
            where: {
                id: centreId
            }
        });

        if (!centre) {
            return res.status(404).send("Centre not found");
        }

        const test = await prisma.diagnosticTest.findUnique({
            where: {
                id: testId
            }
        });

        if (!test) {
            return res.status(404).send("Diagnostic test not found");
        }

        await prisma.diagnosticCentre.update({
            where: {
                id: centreId
            },
            data: {
                tests: {
                    connect: {
                        id: testId
                    }
                }
            }
        });

        console.log(`Test ${testId} added to centre ${centreId}`);

        res.status(200).send("Diagnostic test added to centre");

    } catch (err) {
        console.log("Add test to centre error:", err);
        res.status(500).send("Internal server error");
    }
};

const getCentres = async (req, res) => {
    try {
        const centres = await prisma.diagnosticCentre.findMany({
            include: {
                tests: true
            }
        });

        res.status(200).json(centres);

    } catch (err) {
        console.log("Get centres error:", err);
        res.status(500).send("Internal server error");
    }
};

export {
    createTest,
    createCentre,
    addTestToCentre,
    getCentres
};