const app = require("express")();

const port = 3000;

app.get("", (req, res) => {
    res.send("hello");
});

app.listen(port, () => {
    console.log(`app up at port ${port}`);
})