import { server } from '../app'
import {config} from 'dotenv'
config()

const PORT = process.env.SERVE_PORT || 3000;
server.listen(PORT, () => console.log(`Express Serving@PORT -> ${PORT}`));