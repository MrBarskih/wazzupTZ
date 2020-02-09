
import { Router } from 'express';

import models from '../../models';
import http from "../../../config/http";

const router = Router();

router.get("/", (req, res) => {
  try{

  }catch (error) {
    res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
  }
});

export default router;