
import { Router } from 'express';

import models from '../../models';
import http from "../../../config/http";
import uuidv4 from 'uuid/v4'

const router = Router();

router.get("/", (req, res) => {
  try{

  }
  catch (error) {
    res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
  }
});

router.post("/", async (req, res) => {
  try{
 	 let bookmarks = await models.bookmarks.create({
      	guid: uuidv4(),
		link: req.body.link,
		createdAt: new Date(),
		description: req.body.description,
		favorites: req.body.favorites
	});
  }
  catch (error) {
  	res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
  }
});
export default router;