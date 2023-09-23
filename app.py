from flask_sqlalchemy import SQLAlchemy
import dbExtract
from flask import Flask, render_template, redirect, url_for
from flask import request, make_response
import uuid, math, json

#db reference
db = SQLAlchemy()

itemsPerPage = 15

#creates the app and its routes
def create_app():
    #app/db initialization
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vapeDB1.sqlite3'
    db.init_app(app)#instead of: db = SQLAlchemy(app)
        
    #home page
    #this view mainly displays the data in the table of the 1st page
    #other pages and filter data are taken care of by other views
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
    #todo: prevent users from calling it directly, only for fetchAPI
    #fetches the data to be populated in the filter
    #basically, given a filter pattern, it returns the narrowed down
    #filter values. if the pattern is "all", sends all the filter data
    @app.route('/filterfetcher/<values>', methods=['GET'])
    def filterFetcher(values):
        import models
        print("filter fetcher, pattern:", values)
        if values != "all":
            filters = cleanFilterPattern(values)
            print(filters)
            allProducts = models.filterProducts(filters)
        else:
            allProducts = models.getAllProducts()
        brandList, nicList, sizeList, vgpgList, websiteList = models.getItemsFilterList(allProducts)

        filterValues = {"brandList":brandList,
                        "nicList":nicList,
                        "sizeList":sizeList,
                        "vgpgList":vgpgList,
                        "websiteList":websiteList}
        
        return json.dumps({"filterValues": filterValues})


    #todo: prevent users from calling it directly, only for fetchAPI
    #todo: if invalid redirect to homepage
    #applies the filter sent back by the user from the front end
    @app.route('/filterapplier/<values>', methods=['GET'])
    def filterApplier(values):
        import models
        print("filter")
        filterDict = cleanFilterPattern(values)
        print(filterDict)

        dataRangeStart, dataRangeEnd = dataRangerFinder(1)
        filteredData = models.filterProducts(filterDict, dataRangeStart, dataRangeEnd)
        
        return json.dumps({"filteredData": models.serializeProducts(filteredData)})

    #todo: prevent users from calling it directly, only for fetchAPI
    #todo: if invalid redirect to homepage
    #called on in the background from the front end
    #it fetches pages to be loaded dynmically in the frontend
    #returns a json with the data equalling [itemsPerPage] items
    @app.route('/moredata/<pageNumber>', methods=['GET'])
    def getMoreItems(pageNumber):
        import models
        dataRangeStart, dataRangeEnd = dataRangerFinder(int(pageNumber))
        products = models.getProducts(dataRangeStart, dataRangeEnd)
        
        #serialize and return
        return json.dumps({"returnValue": models.serializeProducts(products)})
        
  
    #make a request to populate the DB with a website
    @app.route('/filldb', methods=['GET'])
    def website():
        import models
        #1: get the json from the scraper/microservice
        #metaValues, itemList = dbExtract.openJson('static/cleanJson_Vape Shop Dubai.json')
        
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
    

    with app.app_context():
        db.create_all()

    return app


#pre-processor for filtering data 
#takes the filters sent from the frontend in a GET request
#cleans them up and returns a dict that be used to fetch the
#products that matches the filter
def cleanFilterPattern(values):
    import urllib.parse
    values = values.replace(";", "/")
    values = values.split("&")
    filterDict = {}
    for value in values:
        value = urllib.parse.unquote(value)
        field, value = value.split("=")
        if field == "vgpgInput" or field == "brandInput":
            filterDict[field] = value.split(",")
        else:
            filterDict[field] = value
    return filterDict

#given page number, it will return start and end item for the DB queries
def dataRangerFinder(pageNumber):
    return (pageNumber-1) * itemsPerPage, pageNumber * itemsPerPage

#attaches a cookie (if needed) to the given response
def attachCookie(response):
    import models
    user_id = request.cookies.get('user_id')
    if not user_id:
        user_id = str(uuid.uuid4())
        response.set_cookie('user_id', user_id, max_age=360000000)
    if not models.userExists(user_id):
        models.addUser(user_id)

