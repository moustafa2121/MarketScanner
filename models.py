from app import db
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
    existingWebsite = ItemWebsite.query.filter_by(name=name).first()
    if existingWebsite is None:
        website = ItemWebsite(name, baseUrl, icon, numberOfItems, timeStamp)
        db.session.add(website)
        if commit:
            db.session.commit()
        return website
    else:
        return existingWebsite

ProductItemType = Enum("Type", ['flavor', 'nic', 'size', 'vgpg'])

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

    def getItemsByType(self, itemType):
        return [item for item in self.items if item.itemType == itemType]

    def getFlavors(self):
        return self.getItemsByType(ProductItemType.flavor)
    def getNics(self):
        return self.getItemsByType(ProductItemType.nic)
    def getSizes(self):
        return self.getItemsByType(ProductItemType.size)
    def getVgpgs(self):
        return self.getItemsByType(ProductItemType.vgpg)

    def __init__(self, itemLink, name, productImageLink, brand, website):
        self.itemLink = itemLink
        self.name = name
        self.productImageLink = productImageLink
        self.brand = brand
        self.website = website

    def __str__(self):
        item_lines = []

        itemsLst = [item.value for item in self.items if isinstance(item, ProductItem)]
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


def addProduct(itemLink, name, productImageLink, brand, website, commit=True):
    existingProduct = Product.query.filter_by(itemLink=itemLink).first()

    if existingProduct is None:
        product = Product(itemLink, name, productImageLink, brand, website)
        db.session.add(product)
        if commit:
            db.session.commit()
        return product
    else:
        return existingProduct

class ProductItem(db.Model):
    __tablename__ = 'product_item'
    id_ = db.Column(db.Integer, primary_key=True)
    itemType = db.Column(db.Enum(ProductItemType), nullable=False)
    
    discriminator = db.Column('type', db.String(50))
    __mapper_args__ = {'polymorphic_on': discriminator}

    product_id = db.Column(db.String(400), db.ForeignKey('product.itemLink'))
    product = db.relationship("Product", back_populates='items')
        
    def __init__(self, itemType, product):
        self.itemType = itemType
        self.product = product

class ProductItem_integer(ProductItem):
    __tablename__ = 'product_item_integer'
    __mapper_args__ = { 'polymorphic_identity': 'product_item_integer', }
    integerValue = db.Column(db.Integer)

    def __init__(self, integerValue, itemType, product):
        super().__init__(itemType, product)
        self.integerValue = integerValue

    def __str__(self):
        return str(self.integerValue)

class ProductItem_string(ProductItem):
    __tablename__ = 'product_item_string'
    __mapper_args__ = { 'polymorphic_identity': 'product_item_string', }
    stringValue = db.Column(db.String(100))

    def __init__(self, stringValue, itemType, product):
        super().__init__(itemType, product)
        self.stringValue = stringValue

    def __str__(self):
        return self.stringValue
  

def addProductItem_integer(integerValue, itemType, product, commit=True):
    existingItem = ProductItem_integer.query.filter_by(integerValue=integerValue, 
                                                     product=product).first()
    if existingItem is None:
        productItem = ProductItem_integer(integerValue, itemType, product)
        db.session.add(productItem)
        if commit:
            db.session.commit()
        return productItem
    else:
        return existingItem

def addProductItem_string(stringValue, itemType, product, commit=True):
    existingItem = ProductItem_string.query.filter_by(stringValue=stringValue, 
                                                     product=product).first()
    if existingItem is None:
        productItem = ProductItem_string(stringValue, itemType, product)
        db.session.add(productItem)
        if commit:
            db.session.commit()
        return productItem
    else:
        return existingItem