
import { Router } from 'express';

import models from '../../models';
import http from "../../../config/http";
import uuidv4 from 'uuid/v4'

import validate from 'validate.js';
import { fieldsConstraints } from '../../validators/bookmarks';
import { limitConstraints, offsetConstraints } from '../../validators/basic';

const router = Router();

//получение всех закладок
router.get("/", async (req, res) => {
	try{
			const validationResult = validate(req.body, {
				fields: fieldsConstraints,
				limit: limitConstraints,
    			offset: offsetConstraints
			});

			if (validationResult) {
				res.status(400).json({ errors: validationResult })
			} 
			else {

				let offset = req.body.offset || 0;
    			let limit = req.body.limit || 50;

    			let results = await Promise.all([
						await models.bookmarks.findAll({
							offset,
							limit
						}),
						await models.bookmarks.count()
    				],);

    			let fields = req.body.fields || [
					'guid',
					'link',
					'createdAt',
					'updatedAt',
					'description',
					'favorites'
				];

				res.status(200).json({
					ho: '' + req.query.x,
					lenght: results[1],
					data: results[0].map(bookmarks => {
						return fields.reduce((object, current) => {
							if (bookmarks[current] !== null) {
								object[current] = bookmarks[current];
							}

							return object;
						}, {});
					})
				});
			}
		}
  	catch (error) {
   		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
 	 }
});

//добавление в закладок в бд
router.post("/", async (req, res) => {

	try{
		let createdAt = new Date();
		let guid = uuidv4();
		let bookmarks = await models.bookmarks.create({
			guid: guid,
			link: req.body.link,
			createdAt: createdAt,
			description: req.body.description,
			favorites: req.body.favorites
		});

		res.status(201).json({
			data: {
				guid: guid,
				createdAt: createdAt
			}
		});

	}
	catch (error) {
		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
	}
});

//изменение закладки
router.patch("/:guid", async (req, res) =>{
	try{
		let bookmarks = await models.bookmarks.update(
			{
				link: req.body.link,
				description: req.body.description,
				favorites: req.body.favorites
			},
   			{where: {guid: req.params.guid}}
		);
		res.status(200).json();
	}catch(error){
		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
	}
});

//удаление в закладок в бд
router.delete("/:guid", async (req, res) => {

	try{
		let bookmarks = await models.bookmarks.destroy({
			where:{guid: req.params.guid}
		});
		res.status(200).json();
	}
	catch (error) {
		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
	}
});

export default router;