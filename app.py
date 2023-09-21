from flask_sqlalchemy import SQLAlchemy
import dbExtract
from flask import Flask, render_template, redirect, url_for
from flask import request, make_response
import uuid, math, json

#db reference
db = SQLAlchemy()


#creates the app and its routes
def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vapeDB9.sqlite3'
    db.init_app(app)#instead of: db = SQLAlchemy(app)
    
    itemsPerPage = 15
        
    def dataRangerFinder(pageNumber):
        return (pageNumber-1) * itemsPerPage, pageNumber * itemsPerPage

    @app.route('/', methods=['GET'])
    def homePage():
        import models
        
        #get the data range
        dataRangeStart, dataRangeEnd = dataRangerFinder(1)
        
        allProducts = models.getAllProducts()
        totalItems = len(allProducts)

        #data to be sent
        dataInRange = models.getProducts(dataRangeStart, dataRangeEnd)
        totalPages = math.ceil(totalItems/itemsPerPage)
        constantsValues = {'noDataVariable':'No Data',
                           "itemsPerPage":itemsPerPage,
                           "totalPages":totalPages,
                           "totalItems":totalItems,}

        response = make_response(render_template("index.html",
                                                lst=dataInRange,
                                                constantsValues=constantsValues))
        
        #check cookie, if needed it will attach to the response
        attachCookie(response)

        return response

    #todo: prevent users from calling it directly, only for fetchAPI
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
        nicList, sizeList, vgpgList, websiteList = models.getItemsFilterList(allProducts)
        nicMin, nicMax = getMinMaxOr0(nicList)
        sizeMin, sizeMax = getMinMaxOr0(sizeList)

        filterValues = {"brandList":models.getBrandList(allProducts),
                        "nicMin":nicMin,
                        "nicMax":nicMax,
                        "sizeMin":sizeMin,
                        "sizeMax":sizeMax,
                        "vgpgList":vgpgList,
                        "websiteList":websiteList}
        
        return json.dumps({"filterValues": filterValues})
        #if invalid redirect to homepage

    def getMinMaxOr0(lst):
        if len(lst) > 0:
            return min(lst), max(lst)
        else:
            return 0, 0


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

    #todo: prevent users from calling it directly, only for fetchAPI
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
    @app.route('/moredata/<pageNumber>', methods=['GET'])
    def getMoreItems(pageNumber):
        import models
        dataRangeStart, dataRangeEnd = dataRangerFinder(int(pageNumber))
        products = models.getProducts(dataRangeStart, dataRangeEnd)
        
        #serialize and return
        return json.dumps({"returnValue": models.serializeProducts(products)})
        
        #if invalid redirect to homepage

  
    #make a request to populate the DB with a website
    @app.route('/filldb', methods=['GET'])
    def website():
        import models
        #1: get the json from the scraper/microservice
        metaValues, itemList = dbExtract.openJson('static/cleanJson_Vape Shop Dubai.json')
        
        #products = models.Product.query.all()
        #for product in products:
        #    db.session.delete(product)
        #db.session.commit()
        #print(models.Product.query.all())
        #websiteObject = models.ItemWebsite.query.all()
        #for obj in websiteObject:
        #    db.session.delete(obj)
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
        #                    item['brand'],
        #                    websiteObject,
        #                    commit)
            
        #    [models.addProductItem_string(flav, models.ProductItemType.flavor, productTmp, commit) for flav in item['flavor']]
        #    [models.addProductItem_integer(nic, models.ProductItemType.nic, productTmp, commit) for nic in item['nic']]
        #    [models.addProductItem_integer(size, models.ProductItemType.size, productTmp, commit) for size in item['size']]
        #    [models.addProductItem_string(str(vgpg), models.ProductItemType.vgpg, productTmp, commit) for vgpg in item['vgpg']]
                   
        return "olo"
    

    with app.app_context():
        db.create_all()

    return app



def attachCookie(response):
    user_id = request.cookies.get('user_id')
    if not user_id:
        user_id = str(uuid.uuid4())
        response.set_cookie('user_id', user_id, max_age=360000000)

    import models
    if not models.userExists(user_id):
        models.addUser(user_id)

