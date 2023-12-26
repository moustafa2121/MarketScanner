#the views for the app

from flask_sqlalchemy import SQLAlchemy
import dbExtract
from flask import Flask, render_template, redirect, url_for
from flask import request, make_response
import uuid, math, json

#db reference
db = SQLAlchemy()

itemsPerPage = 15
#test
#creates the app and its routes
def create_app():
    #app/db initialization
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vapeDB1.sqlite3'
    db.init_app(app)#instead of: db = SQLAlchemy(app)
        
    #home page
    #this view mainly displays the data in the table of the 1st page
    #other pages and filter data are taken care of by the 'moredata' view
    @app.route('/', methods=['GET'])
    def homePage():
        import models
        
        #get the data range
        dataRangeStart, dataRangeEnd = dataRangerFinder(1)
        #get all products (to know page number and number of items)
        allProducts = models.getAllProducts()
        totalItems = len(allProducts)
        totalPages = math.ceil(totalItems/itemsPerPage)

        #data to be sent
        dataInRange = models.getProducts(dataRangeStart, dataRangeEnd)
        constantsValues = {'noDataVariable':'No Data',
                           "itemsPerPage":itemsPerPage,
                           "totalPages":totalPages,
                           "totalItems":totalItems,}

        #construct a response
        response = make_response(render_template("index.html",
                                                lst=dataInRange,
                                                constantsValues=constantsValues))
        
        #check cookie, if needed it will attach to the response
        #usually for first time visitors
        attachCookie(response)

        return response

    #todo: if invalid redirect to homepage
    #todo: if no data vailable?
    #todo: prevent users from calling it directly, only for fetchAPI
    #fetches the data to be populated in the filter modal
    #Given a filter pattern, it returns the narrowed down
    #filter values. if the pattern is "all", sends all the filter data
    #also returns how many Products and total pages for the given filter
    @app.route('/filterfetcher/<values>', methods=['GET'])
    def filterFetcher(values):
        import models
        print("filter fetcher, pattern:", values)
        
        #fetch the Products based on the filter passed
        if values != "all":
            filters = cleanFilterPattern(values)
            allProducts = models.filterProducts(filters)
        else:
            allProducts = models.getAllProducts()
        
        #get the filterData based on the Products fetched (for further filtering)
        brandList, nicList, sizeList, vgpgList, websiteList = models.getFilterData(allProducts)

        return json.dumps({"filterValues": {"brandList":brandList,
                                            "nicList":nicList,
                                            "sizeList":sizeList,
                                            "vgpgList":vgpgList,
                                            "websiteList":websiteList},
                           "totalPages":math.ceil(len(allProducts)/itemsPerPage),
                           "totalItems":len(allProducts)})

    #todo: prevent users from calling it directly, only for fetchAPI
    #todo: if invalid redirect to homepage
    #called on in the background from the frontend
    #it fetches pages to be loaded dynmically in the frontend
    #returns a json with the data equalling [itemsPerPage] items
    #the pageNumber is the page requested for the items to be displayed
    #the values is the filter to be applied on the Products.
    @app.route('/moredata/<pageNumber>/<values>', methods=['GET'])
    def getMoreItems(pageNumber, values):
        import models
        #calculate the range of the products based on pageNumber
        dataRangeStart, dataRangeEnd = dataRangerFinder(int(pageNumber))
        #fetch the products
        if values == "all":#get all products
            products = models.getProducts(dataRangeStart, dataRangeEnd)
        else:#get filtered products
            filterDict = cleanFilterPattern(values)
            products = models.filterProducts(filterDict, dataRangeStart, dataRangeEnd)
        
        #serialize and return
        return json.dumps({"returnValue": models.serializeProducts(products)})
        
  
    #make a request to populate the DB with a website
    @app.route('/filldb', methods=['GET'])
    def website():
        import models
        #1: get the json from the scraper/microservice
        #metaValues, itemList = dbExtract.openJson('dbData/cleanJson_Vape Shop Dubai.json')
        
        #products = models.Product.query.all()
        #for product in products:
        #    db.session.delete(product)
        #db.session.commit()
        #print(models.Product.query.all())

        #websiteObject = models.ItemWebsite.query.all()
        #for obj in websiteObject:
            #db.session.delete(obj)
        #db.session.commit()
        #print(models.ItemWebsite.query.all())

        #2: create and save the db items
        #commit = True
        #websiteObject = models.addWebsite(metaValues['websiteName'],
        #                           metaValues['websiteBase'],
        #                           metaValues['websiteIcon'],
        #                           metaValues['numberOfItems'],
        #                           metaValues['timestamp'],
        #                           commit)

        ##add the items
        #for i, item in enumerate(itemList):
        #    print("adding: ", i)
        #    productTmp = models.addProduct(item['itemLink'],
        #                    item['name'],
        #                    item['productImageLink'],
        #                    websiteObject,
        #                    commit)
            
        #    models.addItemToProduct(item['brand'], productTmp, models.Brand, "brands", commit)
        #    [models.addItemToProduct(flav, productTmp, models.Flavor, "flavors", commit) for flav in item['flavor']]
        #    [models.addItemToProduct(nic, productTmp, models.Nic, "nics", commit) for nic in item['nic']]
        #    [models.addItemToProduct(size, productTmp, models.Size, "sizes", commit) for size in item['size']]
        #    [models.addItemToProduct(str(vgpg), productTmp, models.Vgpg, "vgpgs", commit) for vgpg in item['vgpg']]
        
        #print(models.Size.query.all())
        #print(models.Size.query.all()[0].value)
        #print(type(models.Size.query.all()[0].value))
        #productsWithSize10 = models.Product.query.join(models.Product.sizes).filter(models.Size.value == 30).all()
        #print(productsWithSize10[0])
        #print(len(productsWithSize10))

        #filters = {"nicMin": "5",
        #           "nicMax":"20"}

        #lst = models.filterProducts(filters)
        ##print(lst)
        ##print(lst)
        #[print(i.nics) for i in lst]
        #print(lst[0].brands)

        return "olo"
    

    #creates the DB
    with app.app_context():
        db.create_all()

    return app


#below are helper functions

#pre-processor for filtering data 
#takes the filters sent from the frontend in a GET request
#cleans them up and returns a dict to be used to fetch the
#products that matches the filter
def cleanFilterPattern(values):
    import urllib.parse
    values = values.replace(";", "/")
    values = values.split("&")
    filterDict = {}
    for value in values:
        value = urllib.parse.unquote(value)
        field, value = value.split("=")
        value = value.replace("*", "&")
        if field == "vgpgInput":
            filterDict[field] = value.split(",")
        elif field == "brandInput":
            filterDict[field] = value.split(",")
            filterDict["brandInput"] = list(map(lambda x:x.rsplit(" (", 1)[0], filterDict["brandInput"]))
        else:
            filterDict[field] = value
    return filterDict

#given page number, it will return start and end item for the DB queries
def dataRangerFinder(pageNumber):
    return (pageNumber-1) * itemsPerPage, pageNumber * itemsPerPage

#attaches a cookie (if needed) to the given response
#if a first time user, it generates a unique cookie id
def attachCookie(response):
    import models
    user_id = request.cookies.get('user_id')
    if not user_id:
        user_id = str(uuid.uuid4())
        response.set_cookie('user_id', user_id, max_age=360000000)
    if not models.userExists(user_id):
        models.addUser(user_id)

