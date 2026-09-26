import express from "express";

import {
    createTest,
    createCentre,
    addTestToCentre,
    getCentres
} from "../controllers/centreController.js";

const router = express.Router();

router.post("/tests", createTest);

router.post("/", createCentre);

router.post("/:centreId/tests/:testId", addTestToCentre);

router.get("/", getCentres);

export default router;