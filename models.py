#holds and manages models in the DB


from app import db
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy import func, and_, or_

#establishes wishlist between User and Product
#currently not utilized
wishlist_table = db.Table(
    'wishlist',
    db.Column('user_id', db.Integer, db.ForeignKey('user_model.sessionID')),
    db.Column('product_id', db.String(400), db.ForeignKey('product.itemLink')),
)

#the User of the page, mainly for holding wishlists of Product
class UserModel(db.Model):
    __tablename__ = "user_model"
    id_ = db.Column('sessionID', db.Integer, primary_key = True)
    name = db.Column(db.String(200))
   
    #define the many-to-many relationship with Product through the 'wishlist' table
    wishlist = db.relationship('Product', secondary=wishlist_table, back_populates='users')

    def __init__(self, name):
        self.name = name
    def __str__(self):
        return str(self.id_)

#User related functions
def getUser(name):
    return UserModel.query.filter_by(name=name).first()
def userExists(name):
    return UserModel.query.filter_by(name=name).first() is not None
def addUser(name):
    db.session.add(UserModel(name=name))
    db.session.commit()

#the website of a given Product
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

#define association tables for many-to-many relationships between Product and its items
product_brand_association = db.Table('product_brand_association',
    db.Column('product_id', db.String(400), db.ForeignKey('product.itemLink')),
    db.Column('brand_id', db.String(255), db.ForeignKey('brand_item.value'))
)
product_flavor_association = db.Table('product_flavor_association', db.Model.metadata,
    db.Column('product_id', db.String(400), db.ForeignKey('product.itemLink')),
    db.Column('flavor_id', db.String(100), db.ForeignKey('flavor_item.value'))
)
product_nic_association = db.Table('product_nic_association', db.Model.metadata,
    db.Column('product_id', db.String(400), db.ForeignKey('product.itemLink')),
    db.Column('nic_id', db.Integer, db.ForeignKey('nic_item.value'))
)
product_size_association = db.Table('product_size_association', db.Model.metadata,
    db.Column('product_id', db.String(400), db.ForeignKey('product.itemLink')),
    db.Column('size_id', db.Integer, db.ForeignKey('size_item.value'))
)
product_vgpg_association = db.Table('product_vgpg_association', db.Model.metadata,
    db.Column('product_id', db.String(400), db.ForeignKey('product.itemLink')),
    db.Column('vgpg_id', db.String(5), db.ForeignKey('vgpg_item.value'))
)

#the product (vape juice)
class Product(db.Model, SerializerMixin):
    __tablename__ = "product"
    itemLink = db.Column(db.String(400), primary_key=True)
    name = db.Column(db.String(255))
    productImageLink = db.Column(db.String(400))

    #many-to-many relationships
    brands = db.relationship('Brand', secondary=product_brand_association, back_populates='products')
    flavors = db.relationship('Flavor', secondary=product_flavor_association, back_populates='products')
    nics = db.relationship('Nic', secondary=product_nic_association, back_populates='products')
    sizes = db.relationship('Size', secondary=product_size_association, back_populates='products')
    vgpgs = db.relationship('Vgpg', secondary=product_vgpg_association, back_populates='products')

    websiteName = db.Column(db.String(100), db.ForeignKey('itemWebsite.name'))
    website = db.relationship('ItemWebsite', back_populates='products')
    users = db.relationship('UserModel', secondary=wishlist_table, back_populates='wishlist')

    def getWebIcon(self):
        if self.website:
            return self.website.icon
        return None
    def getWebUrl(self):
        if self.website:
            return self.website.baseUrl
        return None

    def __init__(self, itemLink, name, productImageLink, website):
        self.itemLink = itemLink
        self.name = name
        self.productImageLink = productImageLink
        self.website = website

    def __str__(self):
        brands_str = ", ".join([brand.value for brand in self.brands])
        flavors_str = ", ".join([flavor.value for flavor in self.flavors])
        nics_str = ", ".join([str(nic.value) for nic in self.nics])
        sizes_str = ", ".join([str(size.value) for size in self.sizes])
        vgpgs_str = ", ".join([vgpg.value for vgpg in self.vgpgs])

        return f"Product Information:\n" \
               f"Item Link: {self.itemLink}\n" \
               f"Name: {self.name}\n" \
               f"Product Image Link: {self.productImageLink}\n" \
               f"Website Name: {self.websiteName}\n" \
               f"Brands: {brands_str}\n" \
               f"Flavors: {flavors_str}\n" \
               f"Nics: {nics_str}\n" \
               f"Sizes: {sizes_str}\n" \
               f"Vgpgs: {vgpgs_str}\n"
    

def addProduct(itemLink, name, productImageLink, website, commit=True):
    existingProduct = Product.query.filter_by(itemLink=itemLink).first()
    if existingProduct is None:
        product = Product(itemLink, name, productImageLink, website)
        db.session.add(product)
        if commit:
            db.session.commit()
        return product
    else:
        return existingProduct

#values describing the Product
class Brand(db.Model, SerializerMixin):
    __tablename__ = 'brand_item'
    value = db.Column(db.String(255), primary_key=True)
    products = db.relationship("Product", secondary=product_brand_association, back_populates='brands')
    def __init__(self, value):
        self.value = value

class Flavor(db.Model, SerializerMixin):
    __tablename__ = 'flavor_item'
    value = db.Column(db.String(100), primary_key=True)
    products = db.relationship("Product", secondary=product_flavor_association, back_populates='flavors')
    def __init__(self, value):
        self.value = value

class Nic(db.Model, SerializerMixin):
    __tablename__ = 'nic_item'
    value = db.Column(db.Integer, primary_key=True)
    products = db.relationship("Product", secondary=product_nic_association, back_populates='nics')
    def __init__(self, value):
        self.value = value

class Size(db.Model, SerializerMixin):
    __tablename__ = 'size_item'
    value = db.Column(db.Integer, primary_key=True)
    products = db.relationship("Product", secondary=product_size_association, back_populates='sizes')
    def __init__(self, value):
        self.value = value

class Vgpg(db.Model, SerializerMixin):
    __tablename__ = 'vgpg_item'
    value = db.Column(db.String(5), primary_key=True)
    products = db.relationship("Product", secondary=product_vgpg_association, back_populates='vgpgs')
    def __init__(self, value):
        self.value = value

#general function that adds all the items to a given product
def addItemToProduct(itemValue, product, itemClass, relationshipAttr, commit=True):
    existingItem = itemClass.query.filter_by(value=itemValue).first()

    if existingItem is None:
        newItem = itemClass(value=itemValue)
        db.session.add(newItem)
    else:
        newItem = existingItem

    # associate the item with the product
    if newItem not in getattr(product, relationshipAttr):
        getattr(product, relationshipAttr).append(newItem)

    if commit:
        db.session.commit()

#serialize a list of Product
def serializeProducts(productList):
    return [productSerializer(product) for product in productList]

#serializes a products and its items
#used after querying Products (filtered or not) and sends then async to the frontend
def productSerializer(item):
    result = item.to_dict(rules=('-website', '-users', '-sizes', '-nics', 
                                 '-vgpgs', '-flavors', '-brands'))
    result['brand'] = listIt(item.brands)
    result['flavor'] = listIt(item.flavors)
    result['nic'] = listIt(item.nics)
    result['size'] = listIt(item.sizes)
    result['vgpg'] = listIt(item.vgpgs)
    result['icon'] = item.getWebIcon()
    result['baseUrl'] = item.getWebUrl()

    return result

#used for Brand, it takes a list of Brand, counts them and returns
#a Set in which each item is a string followed by the # of its occurances
#i.e. how many Product does a brand have in the given list
def listToSetCounter(stringLst):
    stringSet = {}
    for string in stringLst:
        if string == "": continue
        if string in stringSet:
            stringSet[string] += 1
        else:
            stringSet[string] = 1
    return {f"{string} ({count})" for string, count in stringSet.items()}

#fetchers for Product
def getProducts(start, end):
    return Product.query.limit(end-start).offset(start).all()
def getAllProducts():
    return Product.query.all()

#given a query of Product objects, returns filter data that are found in these objects
#and can be applied to for further filtering of the said objects
def getFilterData(products):
    brandList, nicSet, sizeSet, vgpgSet, websiteSet = [], set(), set(), set(), set()
    for product in products:
        websiteSet.add(product.website.name)
        nicSet.update(listIt(product.nics))
        sizeSet.update(listIt(product.sizes))
        vgpgSet.update(listIt(product.vgpgs))
        brandList += listIt(product.brands)
    brandSet = listToSetCounter(brandList)
    return sorted(list(brandSet)), sorted(list(nicSet)), sorted(list(sizeSet)), sorted(list(vgpgSet)), sorted(list(websiteSet))

#given a properly formatted filter (after being submitted with GET)
#this function will return the filtered products.
def filterProducts(filters, start=0, end=9999):
    query = Product.query
    if "nameInput" in filters.keys():
        query = query.filter(Product.name.contains(filters["nameInput"]))
    if "flavorInput" in filters.keys():
        query = query.join(Product.flavors).filter(func.lower(Flavor.value).contains(func.lower(filters["flavorInput"])))
    if "websiteSelect" in filters.keys():
        query = query.filter(Product.websiteName==filters["websiteSelect"])
    if "brandInput" in filters.keys():
        query = query.filter(or_(*[Product.brands.any(value=brand) for brand in filters["brandInput"]]))
    if "vgpgInput" in filters.keys():
        query = query.filter(or_(*[Product.vgpgs.any(value=vgpg) for vgpg in filters["vgpgInput"]]))

    if "sizeMin" in filters.keys() and "sizeMax" in filters.keys():
        query = query.join(Product.sizes).filter(and_(Size.value >= int(filters["sizeMin"]), Size.value <= int(filters["sizeMax"])))
    elif "sizeMin" in filters.keys():
        query = query.join(Product.sizes).filter(Size.value >= int(filters["sizeMin"]))
    elif "sizeMax" in filters.keys():
        query = query.join(Product.sizes).filter(Size.value <= int(filters["sizeMax"]))

    if "nicMin" in filters.keys() and "nicMax" in filters.keys():
        query = query.join(Product.nics).filter(and_(Nic.value >= int(filters["nicMin"]),Nic.value <= int(filters["nicMax"])))
    elif "nicMin" in filters.keys():
        query = query.join(Product.nics).filter(Nic.value >= int(filters["nicMin"]))
    elif "nicMax" in filters.keys():
        query = query.join(Product.nics).filter(Nic.value <= int(filters["nicMax"]))

    #for some reason this returns some funky results. they are
    #correctly filtered but they are returned in arbitrary sizes
    #as in they do not abide by the limit, this only happens with the min and max filters
    #so we have to get all items and use regular python list slicing which is suboptimal
    #return query.limit(end-start).offset(start).all()

    return query.all()[start:end]


#used to obtain the values of any of the items when passed by Product
listIt = lambda item: sorted([i.value for i in item])