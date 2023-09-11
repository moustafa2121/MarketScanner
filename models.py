from flask_sqlalchemy import SQLAlchemy
from app import app

def setupDB():
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vapeDB.sqlite3'
    return SQLAlchemy(app)
    
db = setupDB()

#    with app.app_context():
#        db.create_all()

#class UserModel(db.Model):
#   id = db.Column('sessionID', db.Integer, primary_key = True)
#   name = db.Column(db.String(200))

#   #filter
#   #wishlist
    
#   def __init__(self, name):
#       self.name = name


#def runTest():
#    #db.session.add(UserModel("testName"))
#    print(UserModel.query.filter_by(name = "testName").all())