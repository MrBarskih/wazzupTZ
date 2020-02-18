
import { Router } from 'express';

import models from '../../models';
import uuidv4 from 'uuid/v4'

import validate from 'validate.js';
import { sortByConstraints, sortDirConstraints, linkConstraints, favoritesConstraints } from '../../validators/bookmarks';
import { limitConstraints, offsetConstraints } from '../../validators/basic';

const router = Router();

 /*@apiParam {Number} offset Смещение начала выборки (с какого по счету, по умолчанию 0)
 * @apiParam {Number} limit Ограничение выборки (как много элементов добавить в выборку, по умолчанию 10)
 * @apiParam {String} sort_by Имя поля для сортировки, доступные значения: "createdAt", "favorites"
 * @apiParam {String} Направление сортировки, доступные значения: "asc" / "desc"
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *   { 
 *     "data": [
 *       {
 *         	"guid": "a85f0b67-5641-4716-a8a8-bb6740b7eea7",
 *          "link": "https://google.drive.com",
 *          "createdAt": "2020-02-10T17:33:28.456Z",
 *          "description": "Гугл драйв",
 *          "favorites": true
 *       }, ...
 *       {
 *         "guid": "5e5d63b3-fca3-4ce7-8338-45d29c185931",
 *          "link": "https://google.com",
 *          "createdAt": "2020-02-11T18:18:57.520Z",
 *          "description": "Гугл",
 *          "favorites": true
 *       }
 *     ]
 *   }
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *       "limit": [
 *         "Limit is not a number",
 *         "Limit must be greater than or equal to 0"
 *       ],
 *       "offset": [
 *         "Offset is not a number",
 *         "Offset must be greater than or equal to 0"
 *       ],
 *       "sort_by": [
 *         "Sort by is not string"
 *		   "Sort by is not createdAt,favorites"
 *       ]
 *		 "sort_dir": [
 *         "Sort dir is not string"
 *		   "Sort dir is not asc,desc"
 *       ]
 *     }
 *   }
 */
router.get("/", async (req, res) => {
	try{
		const validationResult = validate(req.query, {
			limit: limitConstraints,
			offset: offsetConstraints,
			sort_by: sortByConstraints,
			sort_dir: sortDirConstraints
		});

		if (validationResult) {
			res.status(400).json({ errors: validationResult })
		} 
		else {

			let offset 		= req.query.offset || 0;
			let limit 		= req.query.limit || 50;
			/*let filter 		= req.query.filter;
			let filterValue = req.query.filter_value;
			let filterFrom 	= req.query.filter_from;
			let filterTo 	= req.query.filter_to;*/
			let sortBy 		= req.query.sort_by || "createdAt";
			let sortDir 	= req.query.sort_dir || "asc";

			let results = await Promise.all([
					await models.bookmarks.findAndCountAll({
						offset,
						limit,
						order :[
							[`${sortBy}`, `${sortDir}`]
						]
					})
				]);

			let fields = [
				'guid',
				'link',
				'createdAt',
				'description',
				'favorites'
			];

			res.status(200).json({
				lenght: results[0].count,
				data: results[0].rows.map(bookmarks => {
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
	catch(error){
		res.status(400).json({errors:{backend:["An error has occured: ", error]}})
	}
});

/* @apiParam {String} link Ссылка на веб-страницу
 * @apiParam {String} description(не обязательно) Описание ссылки
 * @apiParam {Boolean} favorites(default: false) Отметить как избранное
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 201 Created
 *   { 
 *      "data": {
	 *      "guid": "0fd77e55-0295-462e-a046-ec0baac09a49",
	 *      "createdAt": "2020-02-18T09:49:34.787Z"
 * 		}
 *	 }
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *       "favorites": [
 *          "Favorites is not boolean"
 *       ],
 *       "link": [
 *          {
 *    			code: 'BOOKMARKS_INVALID_LINK',
 *    			description: 'Invalid link'
 *  		},
 *          {
 *     			code: 'BOOKMARKS_BLOCKED_DOMAIN',
 *     			description: '"yahoo.com" banned'
 *   		}
 *       ],
 *     }
 *   }
 */
//добавление в закладок в бд
router.post("/", async (req, res) => {

	try{

		const validationResult = validate(req.body, {
			link: linkConstraints,
			favorites: favoritesConstraints
		});

		if (validationResult) {
			res.status(400).json({ errors: validationResult })
		} 
		else {

			const newCreatedAt = new Date();
			const newGuid = uuidv4();
			await models.bookmarks.create({
				guid: newGuid,
				link: req.body.link,
				createdAt: newCreatedAt,
				description: req.body.description,
				favorites: req.body.favorites || false
			});

			res.status(201).json({
				data: {
					guid: newGuid,
					createdAt: newCreatedAt
				}
			});
		}
	}
	catch (error) {
		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
	}
});

/* @apiParam {String} link Ссылка на веб-страницу
 * @apiParam {String} description(не обязательно) Описание ссылки
 * @apiParam {Boolean} favorites(default: false) Отметить как избранное
 * @apiParam {String} id закладки
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *   
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 404 Not found,

 *   HTTP/1.1 400 Bad Request
 *   {
 *     "errors": {
 *     		"link": [
 *	            {
 *	                "code": "BOOKMARKS_INVALID_LINK",
 *	                "description": "Invalid link"
 *	            },
 *	            {
 *	                "code": "BOOKMARKS_BLOCKED_DOMAIN",
 *	                "description": "yahoo.com banned"
 *	            }
 *	         ],
 *	         "favorites": [
 *	            "Favorites is not boolean"
 *	         ]
 *      }
 *    }
 */
//изменение закладки
router.patch("/:guid", async (req, res) =>{
	try{
		let results = await Promise.all([
			await models.bookmarks.findAndCountAll({
				where: {guid: req.params.guid}
			})
		]);

			if(results[0].count){

				const validationResult = validate(req.body, {
					link: linkConstraints,
					favorites: favoritesConstraints
					});

				if (validationResult) {
					res.status(400).json({ errors: validationResult })
				} 
				else {
					let updatedAt = new Date();
					await models.bookmarks.update(
						{
							link: req.body.link,
							description: req.body.description,
							favorites: req.body.favorites,
							updatedAt: updatedAt
						},
						{where: {guid: req.params.guid}}
					);
					res.status(200).json();
				}
			}else{
				res.status(404).json();
			}
		
	}catch(error){
		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
	}
});

/* @apiParam {String} id закладки
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *   
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 404 Not found,
 */
//удаление в закладок в бд
router.delete("/:guid", async (req, res) => {

	try{
		let results = await Promise.all([
			await models.bookmarks.findAndCountAll({
				where: {guid: req.params.guid}
			})
		]);

		if(results[0].count){
			await models.bookmarks.destroy({
				where:{guid: req.params.guid}
			});
			res.status(200).json();
		
		}else{
			res.status(404).json();
		}
	}
	catch (error) {
		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
	}
});

//дополнительное задание
router.get("/:guid", async (req, res) => {
	try{
		let results = await Promise.all([
			await models.bookmarks.findAndCountAll({
				where: {guid: req.params.guid}
			})
		]);

		let link = results[0].rows['link'];

		if(results[0].count){
			const request = require('request');

			request(`http://htmlweb.ru/analiz/api.php?whois&url=${link}&json`, function (error, response, body) {

		  		res.status(200).json(body);
			});
		}else{
			res.status(404).json();
		}
	}
	catch (error) {
		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
	}
});
export default router;