const app = require("express")();

const port = process.env.PORT || 3000;

app.get("", (req, res) => {
    res.send("hello");
});

app.listen(port, () => {
    console.log(`app up at port ${port}`);
})