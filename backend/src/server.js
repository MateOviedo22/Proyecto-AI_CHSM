import 'dotenv/config';
import {createPostgres} from './db.js';
import {createApp} from './app.js';
if(!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL en backend/.env');
const db=createPostgres(process.env.DATABASE_URL);
const app=createApp({db,jwtSecret:process.env.JWT_SECRET,corsOrigin:process.env.CORS_ORIGIN});
const port=Number(process.env.PORT || 3001);
const server=app.listen(port,()=>console.log(`API Sunshine en http://localhost:${port}`));
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(async()=>{await db.close(); process.exit(0)}));
