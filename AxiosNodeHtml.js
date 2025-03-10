const express = require('express');
const axios = require('axios');
const app = express();
const multer = require("multer");
const path = require("path");
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
const { clearConfigCache } = require("prettier");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploaded_img/cake");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploaded_img/employee");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
const upload2 = multer({ storage: storage2 });

const base_url = "http://localhost:3000";
//const base_url = "http://  Ruk-Com";

app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

const authenticateUser = (req, res, next) => {
    if (req.cookies && req.cookies.userSession) {
      next();
    } else {
      res.redirect("/");
    }
  };

app.get("/", (req, res) => {
    res.render("home"); 
});

app.get("/home", (req, res) => {
    res.render("home"); 
});

//------------------------------------------------------------------------------------------

//register

app.get("/register", (req, res) => {
    try {
      res.render("Register", { error: "" });
    } catch (err) {
      console.error(err);
      res.status(500).send("error register");
      res.redirect("/");
    }
  });
  
  app.post("/register", async (req, res) => {
    try {
      const data = {
        customer_username: req.body.customer_username,
        customer_password: req.body.customer_password,
        Address: req.body.Address,
        email: req.body.email,
      };
      console.log(data);
  
      await axios.post(base_url + "/register", data);
  
      res.render("login", {error: ""});
    } catch (err) {
      const errorMessage = 'มีชื่อผู้ใช้หรืออีเมล์นี้อยู่แล้ว';
      res.render("Register", { error: errorMessage });
    }
  });

//------------------------------------------------------------------------------------------

  //login
app.get("/login", (req, res) => {
    try {
      res.render("login", {error: ""});
    } catch (err) {
      console.error(err);
      res.status(500).send("error login");
    }
  });

  app.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const response = await axios.post(base_url + "/login",  { username, password });
      const role = response?.data?.user; 
      console.log(role);

      if (role) {
        if (role.role === "customer") {
          if (role.username === username) {
            if (role.password == password) {
              res.cookie("userSession", role.username, {httpOnly: true, maxAge: 3600000 });
              return res.redirect("menu_customer");
            } else {
              return res.render("login", {error: "รหัสผ่านผิด"});
            }
          }
        } else if (role.role === "employee") {
          if (role.username === username) {
            if (role.password == password) {
              res.cookie("userSession", role.username, {httpOnly: true, maxAge: 3600000 });
              res.cookie("empSession", role.username, {httpOnly: true, maxAge: 3600000 })
              return res.redirect("menu_employee");
            } else {
              return res.render("login", {error: "รหัสผ่านผิด"});
            }
          }
        }
      } else {
        return res.render("login", { error: "ไม่พบบัญชีนี้" }); 
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Error login");
    }
  });


//---------------------------------------------------------------------------------------

  //menu for customer
  app.get("/menu_customer",  async (req, res) => {
    try {
      if (req.cookies.userSession != null) {
        const response = await axios.get(base_url + "/cake");
        console.log(response.data);
        return res.render("menu_customer", { cakes: response.data});
      } else {
        return res.redirect("/");
      }
    } catch (err) {
      console.error("Error fetching cakes:", err.message);
      res.status(500).send("Error fetching cakes");
    }
  });

  app.post("/menu_customer",  async (req, res) => {
    try {
      const {qty, cake_name, cake_price} = req.body;
      const userSession = req.cookies.userSession;
      await axios.post(base_url + "/menu_customer",  { qty, cake_name, cake_price, userSession });
      return res.redirect("/menu_customer")
    } catch (err) {
      res.status(500).send("Error fetching cakes");
    }
  });

//------------------------------------------------------------------------------------------

  //logout
app.get("/logout",  async (req, res) => {
  try {
    res.clearCookie('userSession');
    res.clearCookie('empSession');
    return res.redirect("/");
  } catch (err) {
    res.status(500).send("Error logout");
  }
});

//------------------------------------------------------------------------------------------

// about
app.get("/about", async (req, res) => {
  try {
    if (req.cookies.userSession != null) {
      const response = await axios.get(base_url + "/Employee/");
      const response2 = await axios.get(base_url + "/Store");
      res.render("about", { Employee: response.data , Store: response2.data});
    } else {
      return res.redirect("/");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("error about");
  }
});

// ------------------------------------------------------------------------------------------

//menu for employee
app.get("/menu_employee",  async (req, res) => {
  try {
    if (req.cookies.empSession) {
      const response = await axios.get(base_url + "/cake");
      console.log(response.data); // ตรวจสอบข้อมูลที่ได้
      res.render("menu_employee", { cakes: response.data});
    } else {
      return res.redirect("/");
    }
  } catch (err) {
    console.error("Error fetching cakes:", err.message); // แสดงข้อความข้อผิดพลาด
    res.status(500).send("Error fetching cakes");
  }
});

// ------------------------------------------------------------------------------------------

// Add menu
app.get("/Add_menu", async (req, res) => {
  try {
    if (req.cookies.empSession) {
      const response = await axios.get(base_url + "/Store");
      return res.render("Add_menu", {store: response.data});
    } else {
      return res.redirect("/");
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).send("error Add_menu");
  }
});

app.post("/Add_menu", upload.single("img"), async (req, res) => {
  try {
    const data = {
      cake_name: req.body.cake_name,
      cake_price: parseInt(req.body.cake_price),
      cake_size: req.body.cake_size,
      cake_status: req.body.cake_status,
      cake_quantity: req.body.cake_quantity,
      img: req.file.filename,
      store_id: parseInt(req.body.store_id)
    }
    console.log(data);
    await axios.post(base_url + "/Cakes", data);
    return res.redirect("/menu_employee")
  } catch (err) {
    console.error(err);
    res.status(500).send("error Add_menu post");
  }
});


app.get("/delete/:id", async (req, res) => {
  try {
    await axios.delete(base_url + "/Cake/" + req.params.id);
    res.redirect("/menu_employee");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// add_new_store
app.post("/add_new_store", async (req, res) => {
  try {
    const {store_name, store_address} = req.body;
    await axios.post(base_url + "/Stores", {store_name, store_address});
    return res.redirect("/Add_menu")
  } catch (err) {
    console.error(err);
    res.status(500).send("error add_new_store");
  }
});

//------------------------------------------------------------------------------------------

//edit_menu
app.get("/edit_menu", async (req, res) => {
  try {
    res.render("edit_menu");
  } catch (err) {
    console.error(err);
    res.status(500).send("error edit_menu");
  }
});

app.get("/edit_menu/:id", async (req, res) => {
  try {
    const response = await axios.get(base_url + "/Cake/" + req.params.id);
    res.render("edit_menu", { Cake: response.data });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error edit_menu get");
  }
});

app.post("/edit_menu/:id", upload.single("imgafter"), async (req, res) => {
  try {
    const data = {
      cake_name: req.body.cake_name,
      cake_price: req.body.cake_price,
      cake_size: req.body.cake_size,
      cake_status: req.body.cake_status,
      cake_quantity: req.body.cake_quantity,
    };

    if (req.file) {
      data.img = req.file.filename; 
    } else {
      data.img = req.body.imgbefore; 
    }

    await axios.put(base_url + "/Cake/" + req.params.id, data);
    return res.redirect("/menu_employee");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error edit_menu post");
  }
});

//------------------------------------------------------------------------------------------

// Add_employee

app.get("/Add_employee", async (req, res) => {
  try {
    if (req.cookies.empSession) {
      res.render("Add_employee");
    } else {
      return res.redirect("/");
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.post("/Add_employee", upload2.single("img"),async (req, res) => {
  try {
    const data = {
      employee_username: req.body.employee_username,
      employee_password: req.body.employee_password,
      position: req.body.position,
      img: req.file.filename
    };
    await axios.post(base_url + "/Employees", data);
    res.redirect("/manage_employee");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
}
);

//------------------------------------------------------------------------------------------

// manage_employee

app.get("/manage_employee",  async (req, res) => {
  try {
    if (req.cookies.empSession) {
      const response = await axios.get(base_url + "/Employee");
      console.log(response.data); // ตรวจสอบข้อมูลที่ได้
      res.render("manage_employee", { Employee: response.data});
    } else {
      return res.redirect("/");
    }
  
  } catch (err) {
    console.error("Error fetching employee:", err.message); // แสดงข้อความข้อผิดพลาด
    res.status(500).send("Error fetching employee");
  }
});


app.get("/delete_employee/:id", async (req, res) => {
  try {
    await axios.delete(base_url + "/Employee/" + req.params.id);
    res.redirect("/manage_employee");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});


//------------------------------------------------------------------------------------------

// manage_customer

app.get("/manage_customer", async (req, res) => {
  try {
    if (req.cookies.empSession) {
      const response = await axios.get(base_url + "/Customer");
      console.log(response.data);  // ตรวจสอบข้อมูลที่ได้
      res.render("manage_customer", { Customer: response.data });
    } else {
      return res.redirect("/");
    }
    
  } catch (err) {
    console.error("Error fetching customer:", err.message);
    res.status(500).send("Error fetching customer");
  }
});

app.get("/delete_customer/:id", async (req, res) => {
  try {
    await axios.delete(base_url + "/Customer/" + req.params.id);
    res.redirect("/manage_customer");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});
// //------------------------------------------------------------------------------------------

// edit_employee
app.get("/edit_employee", async (req, res) => {
  try {
    res.render("edit_employee");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.get("/edit_employee/:id", async (req, res) => {
  try {
    const response = await axios.get(base_url + "/Employee/" + req.params.id);
    res.render("edit_employee", { Employee: response.data });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.post("/edit_employee/:id", upload2.single("imgafter"), async (req, res) => {
  try {
    const dataEmployee = {
      employee_username: req.body.employee_username,
      employee_password: req.body.employee_password,
      position: req.body.position
    };

    if (req.file) {
      dataEmployee.img = req.file.filename; 
    } else {
      dataEmployee.img = req.body.imgbefore; 
    }

    await axios.put(base_url+"/Employee/"+req.params.id,dataEmployee);
    return res.redirect("/manage_employee");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
}
);


//------------------------------------------------------------------------------------------

// edit_customer
app.get("/edit_customer", async (req, res) => {
  try {
    res.render("edit_customer");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.get("/edit_customer/:id", async (req, res) => {
  try {
    const response = await axios.get(base_url + "/Customer/" + req.params.id);
    res.render("edit_customer", { Customer: response.data});
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.post("/edit_customer/:id",async (req, res) => {
  try {
    const data = {
      customer_username: req.body.customer_username,
      customer_password: req.body.customer_password,
      Address: req.body.Address,
      email: req.body.email,
    };
    console.log(data)
    await axios.put(base_url+"/Customer/"+req.params.id,data);
    
    return res.redirect("/manage_customer");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
}
);

// //------------------------------------------------------------------------------------------

// Order_details
app.get("/Order_details", async (req, res) => {
  try {
    if (req.cookies.empSession) {
      const response = await axios.get(base_url + "/jointable_orderdetails");
      console.log(response.data.orders);
      console.log(response.data.reports);
      res.render("Order_detail", { order: response?.data?.orders, report: response?.data?.reports}); 
    } else {
      return res.redirect("/");
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).send("error Order_details");
  }
});

app.get("/add_bill/:id",async (req, res) => {
  try {
    const userSession = req.cookies.userSession;
    await axios.post(base_url + "/add_employee_INOrder/" + req.params.id, {test:"", userSession});
    return res.redirect("/Order_details"); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Error ");
  }
}
);

app.get("/delete_bill/:id",async (req, res) => {
  try {
    await axios.delete(base_url + "/Order_detail/" + req.params.id);
    return res.redirect("/Order_details"); 
  } catch (err) {
    console.error(err);
    res.status(500).send("Error ");
  }
}
);

app.get("/delete_customer/:id", async (req, res) => {
  try {
    await axios.delete(base_url + "/Customer/" + req.params.id);
    res.redirect("/manage_customer");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.listen(5500, () => {
    console.log("server started on port 5500");
});

  


