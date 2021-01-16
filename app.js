//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// this is what creates the Db
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false 
});

const ItemSchema = {
  name: String,
};

const Item = mongoose.model("Item", ItemSchema);

const item1 = new Item({
  name: "Welcome to you todo list"
});

const item2 = new Item({
  name: "hit the plus (+) button"
});

const item3 = new Item({
  name: "<- hit this check box to delete"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [ItemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("you did it, saved items to the DB!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show list that exits
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })

  
})

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;



  const item = new Item({
    name: itemName
  });

  // checks if from the defaul list
  if(listName == "Today"){
    // itll save it to the defaul list
    item.save();
    res.redirect("/");
  }else{
    // if user came from a custom list, and add the item to the custom list
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});




app.post("/delete", function(req,res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  // checks to see if on default list
  if (listName === "Today") {

    Item.findByIdAndRemove(checkedItemID, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("item deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, { $pull: {items: {_id: checkedItemID}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

  
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
