
import { Router } from 'express';

import models from '../../models';
import uuidv4 from 'uuid/v4';
import sequelize from 'sequelize';
import request from 'request';

import validate from 'validate.js';
import { sortByConstraints, sortDirConstraints, linkConstraints, favoritesConstraints, filterConstraints } from '../../validators/bookmarks';
import { limitConstraints, offsetConstraints } from '../../validators/basic';

const router = Router();

//Данная функция выбирает домен из всей линки 
//http://www.blog.classroom.me.uk/index.php - на входе
//www.blog.classroom.me.uk - на выходе
//@apiParam {String} link ссылка для извлечения домена
function getDomain(link) {
	//find & remove protocol (http, ftp, etc.) and get hostname
	if (link.indexOf("//") > -1) {
        link = link.split('/')[2];
    }
    else {
        link = link.split('/')[0];
    }
    link = link.split(':')[0];//find & remove port number
    link = link.split('?')[0];//find & remove "?"
    return link;
}

//Функция для формирования условной части WHERE sql запроса для функций sequelize.FindAndCountAll, sequelize.FindAll
//@apiParam {String} filter Имя поля для фильтрации ("createdAt", "favorites")
//@apiParam {String} value точное значение фильтрации
//@apiParam {String} from Использвуется для фильтрации >=
//@apiParam {String} to Использвуется для фильтрации <=
function getWhereCondition(filter, value, from, to){
	let result;
	if(value){
		result = sequelize.where(sequelize.fn("",sequelize.col(`${filter}`)), value);
	}
	else if(from && to){
		result = sequelize.where(sequelize.fn("",sequelize.col(`${filter}`)), `BETWEEN ${from} AND ` , to);
	}
	else if(from || to){
		from ? 	result = sequelize.where(sequelize.fn("",sequelize.col(`${filter}`)), '>=' , from) :
				result = sequelize.where(sequelize.fn("",sequelize.col(`${filter}`)), '<=' , to);
	}
	else{
		result = null;
	}

	return result;
}

 /*@apiParam {Number} offset Смещение начала выборки (с какого по счету, по умолчанию 0)
 * @apiParam {Number} limit Ограничение выборки (как много элементов добавить в выборку, по умолчанию 10)
 * @apiParam {String} sort_by Имя поля для сортировки, доступные значения: "createdAt", "favorites"
 * @apiParam {String} sort_dir Направление сортировки, доступные значения: "asc" / "desc"
 * @apiParam {String} filter Имя поля для фильтрации ("createdAt", "favorites")
 * @apiParam {String} filter_value точное значение фильтрации
 * @apiParam {String} filter_from Использвуется для фильтрации >= 
 * @apiParam {String} filter_to Использвуется для фильтрации <=
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
 *		 "filter": [
 *         "Sort by is not string"
 *		   "Sort by is not createdAt,favorites"
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
			sort_dir: sortDirConstraints,
			filter: filterConstraints
		});

		if (validationResult){
			res.status(400).json({ errors: validationResult })
		} 
		else {

			const offset 		= req.query.offset || 0;
			const limit 		= req.query.limit || 50;
			const filter 		= req.query.filter;
			const filterValue 	= req.query.filter_value;
			const filterFrom 	= req.query.filter_from;
			const filterTo 		= req.query.filter_to;
			const sortBy 		= req.query.sort_by || "createdAt";
			const sortDir 		= req.query.sort_dir || "asc";

			let results = await Promise.all([
				await models.bookmarks.findAndCountAll({
					where: filter ? getWhereCondition(filter, filterValue, filterFrom, filterTo) : null,
					offset,
					limit,
					order :[
						[`${sortBy}`, `${sortDir}`]
					]
				})
			]);

			const fields = [
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
 * @apiParam {String} guid уникальны номер закладки
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

	}
	catch(error){
		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
	}
});

/* @apiParam {String} guid уникальный номер закладки
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
/* @apiParam {String} guid уникальный номер закладки
 *
 * @apiSuccessExample SUCCESS:
 *   HTTP/1.1 200 OK
 *    {
 *	    "url": "https://web-paint.ru/stati-po-risovaniyu/kak-nauchitsya-risovat-poetapnyj-plan.html",
 *	    "whoIs": {
 *	        "status": "success",
 *	        "country": "Russia",
 *	        "countryCode": "RU",
 *	        "region": "SPE",
 *	        "regionName": "St.-Petersburg",
 *	        "city": "St Petersburg",
 *	        "zip": "192241",
 *	        "lat": 59.9394,
 *	        "lon": 30.2283,
 *	        "timezone": "Europe/Moscow",
 *	        "isp": "BEGET.RU",
 *	        "org": "Beget Ltd",
 *	        "as": "AS198610 Beget LLC",
 *	        "query": "87.236.16.142"
 *	    },
 *	    "openGraph": {
 *	        "og:title": "Как научиться рисовать? Подробный план обучения | web-paint.ru",
 *	        "og:image": "https://web-paint.ru/wp-content/uploads/2018/06/kak.jpg",
 *	        "og:description": "Надеюсь, что эта статья станет отправной точкой на вашем творческом пути. Вы сможете научиться рисовать, используя последовательный метод «шаг за шагом», который я распишу подробно далее."
 *	    }
 *	}
 *
 * @apiErrorExample ALL EXAMPLES:
 *   HTTP/1.1 404 Not found,
 */
//дополнительное задание
//выбор этого api из-за безлимитных запросов.
//изначально делалось через api htmlweb.ru из задания, но там ограниченные запросы (3-5шт. в день)
router.get("/:guid", async (req, res) => {
	try{

		const results = await Promise.all([
			await models.bookmarks.findAndCountAll({
				where: {guid: req.params.guid}
			})
		]);
		
		if(results[0].count){
			const bookmarkUrl = results[0].rows[0].dataValues.link;
			const domain = getDomain(bookmarkUrl);//достается из линки домен

			let result = {url: bookmarkUrl};
			
			//Функция для получения информации о домене с помощюь стороннего API и как писалось выше использовался не WhoIs
			//@apiParam {String} domain домен ссылки например: vk.com
			result['whoIs'] = await new Promise( function (resolve, reject) {
				request(`http://ip-api.com/json/${domain}`, function (error, response, body) {
					if (error){
						reject(res.status(400).json({ errors: { backend: ["Error has occured: ", error] } }));
					}else{
						resolve(JSON.parse(body));
					}
				});
			});

			//Библиотека url-metadata для получения мета данных
			//@apiParam {String} link Ссылка на веб-страницу
			const urlMetadata = require('url-metadata');

			result['openGraph'] = await urlMetadata(bookmarkUrl).then(
				function (metadata) { // success handler
					const res = {
						'og:title' : 		metadata['og:title'] ? metadata['og:title'] : 'не найдено',
						'og:image' : 		metadata['og:image'] ? metadata['og:image'] : 'не найдено',
						'og:description': 	metadata['og:description'] ? metadata['og:description'] : 'не найдено'
					};

				return res;
				},
				function (error) { // failure handler
					res.status(400).json({ errors: { backend: ["Error has occured: ", error] } });
				}
			);

			res.status(200).json(result);

		}else{
			res.status(404).json();
		}

	}
	catch (error) {
		res.status(400).json({ errors: { backend: ["Error has occured: ", error] } })
	}
});
export default router;