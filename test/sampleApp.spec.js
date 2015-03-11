/* global before, after, describe, it */
var Sails = require('sails').Sails;
var fixtures = require('./helpers/fixtures');
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var _ = require('lodash');

describe('Test with models ::', function () {
  //app wrapper
  var sails;
  //before, lift sails
  before(function(done) {
    //set 10sec timeout
    this.timeout(10000);

    //link node modules to the app dir
    try {
      fs.symlinkSync(path.join(__dirname, '../node_modules'), path.join(__dirname, 'helpers/sampleApp/node_modules'), 'file');
    } catch (e1) {
      if (e1.code !== 'EEXIST') {
        throw e1;
      }
    }

    //Try to lift
    new Sails().load({
      appPath: path.join(__dirname, 'helpers/sampleApp'),
      hooks: {
        'fixtures': require('../lib'),
        'grunt': false,
        'views': false,
        'blueprints': false,
      },
      log: {
        level: 'info'
      },
      connections: {
        test: {
          adapter: 'sails-mongo',
          host:'localhost',
          port: 27017,
          database: 'sails-hook-fixtures-testdb'
        },
      },
      models: {
        connection: 'test',
        migrate: 'drop'
      },
      fixtures: fixtures
    }, function (err, _sails) {
      if (err) { return done(err); }
      sails = _sails;
      return done();
    });
  });

  after(function (done) {
    //unlink the node_modules symlink
    try {
      fs.unlinkSync(path.join(__dirname, 'helpers/sampleApp/node_modules'));
    } catch (e0) {
      if (e0.code !== 'EEXIST') {
        throw e0;
      }
    }
    if (sails) {
      return sails.lower(done);
    }
    //otherwise, just done
    return done();
  });

  it('Should have made three user documents', function (done) {
    var User = sails.models.user;
    User.find()
    .then(function (results) {
      results.should.have.length(3);
      done();
    }).catch(done);
  });

  it('Should have made two group documents', function (done) {
    var Group = sails.models.group;
    Group.find()
    .then(function (results) {
      results.should.have.length(2);
      done();
    }).catch(done);
  });

  it('Should have made three role documents', function (done) {
    var Role = sails.models.role;
    Role.find()
    .then(function (results) {
      results.should.have.length(3);
      done();
    }).catch(done);
  });

  it('Should have added an association to group "admin" to user "admin"', function (done) {
    var User = sails.models.user;
    User.findOne({username:'admin'}).populate('groups')
    .then(function (admin) {
      assert(_.some(admin.groups, {name: 'Admin group'}));
      done();
    })
    .catch(done);
  });
  it('Should have added roles to all users', function (done) {
    var User = sails.models.user;
    User.find().populate('roles')
    .then(function (users) {
      var roles = _.map(users, function (user) {
        return user.roles;
      });
      assert(_.some(roles, function (role) { return !_.isEmpty(role); }));
      done();
    })
    .catch(done);
  });
  it('Should Pikachu is owned by Ash Ketchum', function (done) {
    var Pet = sails.models.pet;
    Pet.findOne({name:'Pikachu'}).populate('owner')
    .then(function (pikachu) {
      pikachu.owner.username.should.equal('Ash Ketchum');
      done();
    }).catch(done);
  });

  it('Should say "Pallet Town" is Ash Ketchum\'s hometown', function (done) {
    var User = sails.models.user;
    User.findOne({username: 'Ash Ketchum'}).populate('home')
    .then(function (ash) {
      ash.home.name.should.equal('Pallet Town');
      done();
    }).catch(done);
  });

});
