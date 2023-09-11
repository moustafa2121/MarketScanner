from app import db


class UserModel(db.Model):
   id_ = db.Column('sessionID', db.Integer, primary_key = True)
   name = db.Column(db.String(200))

   #current filter
   #wishlist
    
   def __init__(self, name):
       self.name = name

   def __str__(self):
       return str(self.id_)


def runTest():
    #db.session.add(UserModel("testName"))
    #db.session.commit()
    print(UserModel.query.filter_by(name = "testName").all()[0])
    #print('test')