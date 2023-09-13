from flask_sqlalchemy import SQLAlchemy
import dbExtract
from flask import Flask, render_template
from flask import request, make_response
import uuid

#db reference
db = SQLAlchemy()


#creates the app and its routes
def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vapeDB7.sqlite3'
    #app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = True
    #wsgi_app = app.wsgi_app
    db.init_app(app)#instead of: db = SQLAlchemy(app)
    
    
    @app.route('/', methods=['GET'])
    def homePage():
        import models
        #get the data
        data = dbExtract.openJsonDB("static/vape-shop-dubai.json")
        #used to fill empty cells
        constantsValues = {'noDataVariable' : 'No Data'}


        response = make_response(render_template("index.html", lst=data[:15], constantsValues=constantsValues))
        
        #check cookie, if needed
        attachCookie(response)

        return response

    #make a request to populate the DB with a website
    @app.route('/filldb', methods=['GET'])
    def website():
        import models
        #1: get the json from the scraper/microservice
        metaValues, itemsList = dbExtract.openJson('static/cleanJson_Vape Shop Dubai.json')
        
        #2: create and save the db items
        commit = False
        websiteObject = models.addWebsite(metaValues['websiteName'],
                                   metaValues['websiteBase'],
                                   metaValues['websiteIcon'],
                                   metaValues['numberOfItems'],
                                   'timestamp',
                                   commit)

        #add the items
        for item in itemsList[:1]:
            productTmp = models.addProduct(item['name'],
                            item['itemLink'],
                            item['productImageLink'],
                            item['brand'],
                            websiteObject,
                            commit)
            for flav in item['flavor']:
                currentFlav = models.addProductItem(models.ProductItem, flav, models.ProductItemType.flavor, productTmp, commit)
            for nic in item['nic']:
                currentNic = models.addProductItem(models.ProductItem_integer, nic, models.ProductItemType.nic, productTmp, commit)
            for size in item['size']:
                currentSize = models.addProductItem(models.ProductItem_integer, size, models.ProductItemType.size, productTmp, commit)
            for vgpg in item['vgpg']:
                currentVgpg = models.addProductItem(models.ProductItem, str(vgpg), models.ProductItemType.vgpg, productTmp, commit)

        print(models.ItemWebsite.query.all())
        print(models.Product.query.all()[0])

        #products = models.Product.query.all()
        #print("all products before", products)
        #for product in products:
        #    db.session.delete(product)
        #    db.session.commit()
        #print(models.Product.query.all())

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

