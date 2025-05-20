import express from "express"; 
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import db from "./config/Database.js";
import SequelizeStore from "connect-session-sequelize";
import UserRoute from "./routes/UserRoute.js";
import ProductRoute from "./routes/ProductRoute.js";
import PaymentRoute from "./routes/PaymentRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import connectMongoDB from "./config/DatabaseMongo.js";
import logActivityRoutes from "./routes/logActivityRoutes.js";
dotenv.config();

const app = express();

connectMongoDB();

const sessionStore = SequelizeStore(session.Store);

const store = new sessionStore({
    db: db
});

// (async() => {
//     await db.sync();
// })();

app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        secure: 'auto'
    }
}));

app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}));
app.use(express.json());
app.use(fileUpload());
app.use('/images', express.static('public/images'));
app.use(UserRoute);
app.use(ProductRoute);
app.use(PaymentRoute);
app.use(AuthRoute);
app.use("/api", logActivityRoutes);

// store.sync();

app.listen(process.env.APP_PORT, ()=> {
    console.log('Server up and running...');
});