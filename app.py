from flask_sqlalchemy import SQLAlchemy
import dbInterface
from flask import Flask, render_template
from flask import request, make_response
import uuid

#db reference
db = SQLAlchemy()

#creates the app and its routes
def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vapeDB.sqlite3'
    #wsgi_app = app.wsgi_app

    # Initialize extensions within the app factory
    db.init_app(app)#same as db = SQLAlchemy(app)


    @app.route('/', methods=['GET'])
    def homePage():

        import models
        #get the data
        data = dbInterface.openJsonDB("static/vape-shop-dubai.json")
        #used to fill empty cells
        constantsValues = {'noDataVariable' : 'No Data'}

        print(request.cookies.get(''))
        models.runTest()

        response = make_response(render_template("index.html", lst=data[:15], constantsValues=constantsValues))
        
        #check cookie, if needed
        attachCookie(response)

        return response

    return app

def attachCookie(response):
    user_id = request.cookies.get('user_id')
    if not user_id:
        user_id = str(uuid.uuid4())
        response.set_cookie('user_id', user_id, max_age=360000000)
