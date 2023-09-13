
from app import db
from sqlalchemy.orm import relationship
from enum import Enum

wishlist_table = db.Table(
    'wishlist',
    db.Column('user_id', db.Integer, db.ForeignKey('user_model.sessionID')),
    db.Column('product_id', db.String(400), db.ForeignKey('product.itemLink')),
)

class UserModel(db.Model):
    __tablename__ = "user_model"
    id_ = db.Column('sessionID', db.Integer, primary_key = True)
    name = db.Column(db.String(200))
   
    #Define the many-to-many relationship with Product through the 'wishlist' table
    wishlist = db.relationship('Product', secondary=wishlist_table, back_populates='users')

    def __init__(self, name):
        self.name = name

    def __str__(self):
        return str(self.id_)
   
def getUser(name):
    return UserModel.query.filter_by(name=name).first()
def userExists(name):
    return UserModel.query.filter_by(name=name).first() is not None
def addUser(name):
    db.session.add(UserModel(name=name))
    db.session.commit()

ProductItemType = Enum("Type", ['flavor', 'nic', 'size', 'vgpg'])

class ItemWebsite(db.Model):
    __tablename__ = 'itemWebsite'
    name = db.Column(db.String(100), primary_key=True)
    baseUrl = db.Column(db.String(100))
    icon = db.Column(db.String(400))
    numberOfItems = db.Column(db.Integer)
    timeStamp = db.Column(db.String(10))

    products = db.relationship('Product', back_populates='website')

    def __init__(self, name, baseUrl, icon, numberOfItems, timeStamp):
        self.name = name
        self.baseUrl = baseUrl
        self.icon = icon
        self.numberOfItems = numberOfItems
        self.timeStamp = timeStamp

    def __str__(self):
        return f"ItemWebsite Information:\n" \
               f"Name: {self.name}\n" \
               f"Base URL: {self.baseUrl}\n" \
               f"Icon URL: {self.icon}\n" \
               f"Number of Items: {self.numberOfItems}" \
               f"Timestamp: {self.timeStamp}"

def addWebsite(name, baseUrl, icon, numberOfItems, timeStamp, commit=True):
    website = ItemWebsite(name, baseUrl, icon, numberOfItems, timeStamp)
    db.session.add(website)
    if commit:
        db.session.commit()
    return website


class Product(db.Model):
    __tablename__ = "product"
    itemLink = db.Column(db.String(400), primary_key=True)
    name = db.Column(db.String(255))
    productImageLink = db.Column(db.String(400))
    brand = db.Column(db.String(255))

    websiteName = db.Column(db.String(100), db.ForeignKey('itemWebsite.name'))
    
    website = db.relationship('ItemWebsite', back_populates='products')
    items = db.relationship('ProductItem', back_populates='product')
    users = db.relationship('UserModel', secondary=wishlist_table, back_populates='wishlist')

    def __init__(self, itemLink, name, productImageLink, brand, website):
        self.itemLink = itemLink
        self.name = name
        self.productImageLink = productImageLink
        self.brand = brand
        self.website = website

    def __str__(self):
        item_lines = []

        # Categorize items and add them to the appropriate list
        itemsLst = [item.value for item in self.items if isinstance(item, ProductItem)]

        # Add each type of item to the item_lines list
        if itemsLst:
            item_lines.append("Items:")
            item_lines.extend(itemsLst)

        return f"Product Information:\n" \
               f"Item Link: {self.itemLink}\n" \
               f"Name: {self.name}\n" \
               f"Product Image Link: {self.productImageLink}\n" \
               f"Brand: {self.brand}\n" \
               f"Website Name: {self.websiteName}\n" \
               f"Items:\n" \
               f"{item_lines}"


class ProductItem(db.Model):
    __tablename__ = 'product_item'
    id_ = db.Column(db.Integer, primary_key=True)
    itemType = db.Column(db.Enum(ProductItemType), nullable=False)

    value = db.Column(db.String(100))
    __mapper_args__ = {'polymorphic_on': value}

    product_id = db.Column(db.String(400), db.ForeignKey('product.itemLink'))
    product = db.relationship("Product", back_populates='items')

    def __init__(self, value, itemType, product):
        self.value = value
        self.itemType = itemType
        self.product = product

class ProductItem_integer(ProductItem):
    __tablename__ = 'product_item_integer'
    id_ = db.Column(db.Integer, db.ForeignKey('product_item.id_'), primary_key=True)
    value = db.Column(db.Integer)
    __mapper_args__ = { 'polymorphic_identity': 'product_item_integer', }


def addProduct(name, itemLink, productImageLink, brand, website, commit=True):
    product = Product(name, itemLink, productImageLink, brand, website)
    db.session.add(product)
    if commit:
        db.session.commit()
    return product
    
def addProductItem(productItemClass, value, itemType, product, commit=True):
    productItem = productItemClass(value, itemType, product)
    db.session.add(productItem)
    if commit:
        db.session.commit()
    return productItem