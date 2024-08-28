require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const handleError = require("http-errors");
const cors = require("cors");
const router = require("./router");

const app = express();
const corsOptions = {
    origin: true,
    credentials: true,
};
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", router);
app.use((req, res, next) => {
    next(handleError.NotFound(`Controller ${req.originalUrl} not found`));
});
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    try {
        console.log("Server is running at port: " + PORT);
    } catch (err) {
        console.log(err);
    }
});
