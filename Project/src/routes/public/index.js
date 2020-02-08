import { Router } from 'express';

import api from "./api";
import users from "./users";
import channels from "./channels";
import promoCodes from "./promoCodes";
import emailTokens from "./emailTokens";
import apiConfig from "../../../config/api.json";

const router = Router();

router.use(api);
router.use(`/v${apiConfig.version}/users/`, users);
router.use(`/v${apiConfig.version}/promoCodes/`, promoCodes);
router.use(`/v${apiConfig.version}/emailTokens/`, emailTokens);
router.use(`/v${apiConfig.version}/channels/`, channels);

export default router;
