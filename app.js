const app = require("express")();

const port = parseInt(process.env.PORT) || 8080;

app.get("", (req, res) => {
    res.send("hello");
});

app.listen(port, () => {
    console.log(`app up at port ${port}`);
})