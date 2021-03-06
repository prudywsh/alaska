const expect = require('chai').expect
const app = require('../app')
const request = require('supertest')(app)
const jwtHelper = require('../server/helpers/jwt')
const models = require('../server/models/index')
const _data = require('./_data')

const monthInMS = 2592000000
const weekInS = 604800
const now = new Date().getTime()

const jwt = jwtHelper.create({ email: _data.email1 })
const jwt3 = jwtHelper.create({ email: _data.email3 })

describe('submission routes', () => {

  describe('new submission, no previous submissions', () => {
    // remove all submissions of the user, to avoid waiting time problems
    beforeEach(() => {
      return models.User.findOne({ where: {email: _data.email1} })
      .then(user => models.Submission.destroy({ where: {UserId: user.id} }))
    })

    describe('stage 1', () => {
      // override env variables
      before(() => {
        env = process.env
        // - stage 1 started one month before now, and end in one month
        // - stage 2 start in 2 month and end 1 month later
        process.env = Object.assign({}, process.env, {
          STAGE_1_START: (now - monthInMS) / 1000,
          STAGE_1_END: (now + monthInMS) / 1000,
          STAGE_1_FILE: '../test/answers/1.txt',
          STAGE_2_START: (now + (2 * monthInMS)) / 1000,
          STAGE_2_END: (now + (3 * monthInMS)) / 1000,
          STAGE_2_FILE: '../test/answers/2.txt'
        })
      })

      it('should submit for stage 1', (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '0;1;2;3;4;5' })
          .expect(201)
          .end((err, res) => {
            expect(err).to.be.a('null')
            expect(res.body.sub.stage).to.equal(1)
            done()
          })
      })

      it(`shouldn't submit before stage 1: value is undefined)`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({})
          .expect(400, done)
      })

      it(`shouldn't submit in stage 1 without authentication`, (done) => {
        request.post('/api/submission')
          .send({})
          .expect(401, done)
      })

      // restoring env
      after(() => {
        process.env = env
      })
    })

    describe('stage 2', () => {
      let savedEnv
      // override env variables
      before(() => {
        savedEnv = process.env
        // - stage 1 ended 2 months ago
        // - stage 2 started 1 month ago and end in 1 month
        process.env = Object.assign({}, process.env, {
          STAGE_1_START: (now - (3 * monthInMS)) / 1000,
          STAGE_1_END: (now - (2 * monthInMS)) / 1000,
          STAGE_1_FILE: '../test/answers/1.txt',
          STAGE_2_START: (now - monthInMS) / 1000,
          STAGE_2_END: (now + monthInMS) / 1000,
          STAGE_2_FILE: '../test/answers/2.txt'
        })
      })

      it(`should throw an error if there are less images than expected`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '0;1;2;3;4;5;6;7;8' })
          .expect(400)
          .end((err, res) => {
            expect(res.body.message).to.equal('There are missing images in your answer')
            done()
          })
      })

      it(`should throw an error if there are more images than expected`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '0;1;2;3;4;5;6;7;8;9;10' })
          .expect(400)
          .end((err, res) => {
            expect(res.body.message).to.equal('There are more images than expected in your answer')
            done()
          })
      })

      it(`should throw an error if there are duplicates images in the answer`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '0;1;2;3;4;5;7;7;8;9' })
          .expect(400)
          .end((err, res) => {
            expect(res.body.message).to.equal('There are duplicates images in your answer')
            done()
          })
      })

      it(`should throw an error because one element is no numerical`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '0;1;2;3;4;5;6;yolo;8;9' })
          .expect(400)
          .end((err, res) => {
            expect(res.body.message).to.equal('Image indexes can take only numerical values')
            done()
          })
      })

      it(`should throw an error because one index is bigger than the number of images`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '1;2;3;4;5;6;50;8;9;0' })
          .expect(400)
          .end((err, res) => {
            expect(res.body.message).to.equal('Image indexes cannot be larger than total number of images')
            done()
          })
      })

      it(`should throw an error because one index is lower than 1`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '1;-2;3;4;5;6;7;8;9;0' })
          .expect(400)
          .end((err, res) => {
            expect(res.body.message).to.equal('How did you come out with negative image indexes ?!?')
            done()
          })
      })

      it('should submit for stage 2', (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '1;2;3;4;5;6;7;8;9;0' })
          .expect(201)
          .end((err, res) => {
            expect(err).to.be.a('null')
            expect(res.body.sub.stage).to.equal(2)
            done()
          })
      })

      it(`shouldn't submit before stage 2: value is undefined)`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({})
          .expect(400, done)
      })

      it(`shouldn't submit in stage 2 without authentication`, (done) => {
        request.post('/api/submission')
          .send({})
          .expect(401, done)
      })

      // restoring env
      after(() => {
        process.env = savedEnv
      })
    })

    describe('before stage 1', () => {
      let savedEnv
      // override env variables
      before(() => {
        savedEnv = process.env
        // - stage 1 ended 2 months ago
        // - stage 2 started 1 month ago and end in 1 month
        process.env = Object.assign({}, process.env, {
          STAGE_1_START: (now + (2 * monthInMS)) / 1000,
          STAGE_1_END: (now + (3 * monthInMS)) / 1000,
          STAGE_1_FILE: 'test/answers/1.txt',
          STAGE_2_START: (now + 5 * monthInMS) / 1000,
          STAGE_2_END: (now + 6 * monthInMS) / 1000,
          STAGE_2_FILE: 'test/answers/2.txt'
        })
      })

      it(`shouldn't submit before stage 1 `, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '1;2;3;4;5;0' })
          .expect(403, done)
      })

      after(() => {
        process.env = savedEnv
      })
    })

    describe('between stage 1 and stage 2', () => {
      let savedEnv
      // override env variables
      before(() => {
        savedEnv = process.env
        // - stage 1 ended 2 months ago
        // - stage 2 started 1 month ago and end in 1 month
        process.env = Object.assign({}, process.env, {
          STAGE_1_START: (now - (3 * monthInMS)) / 1000,
          STAGE_1_END: (now - (2 * monthInMS)) / 1000,
          STAGE_1_FILE: 'test/answers/1.txt',
          STAGE_2_START: (now + 5 * monthInMS) / 1000,
          STAGE_2_END: (now + 6 * monthInMS) / 1000,
          STAGE_2_FILE: 'test/answers/2.txt'
        })
      })

      it(`shouldn't submit after stage 1 and before stage 2`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '1;2;3;4;5;0' })
          .expect(403, done)
      })

      after(() => {
        process.env = savedEnv
      })
    })

    describe('after stage 2', () => {
      let savedEnv
      // override env variables
      before(() => {
        savedEnv = process.env
        // - stage 1 ended 2 months ago
        // - stage 2 started 1 month ago and end in 1 month
        process.env = Object.assign({}, process.env, {
          STAGE_1_START: (now - (6 * monthInMS)) / 1000,
          STAGE_1_END: (now - (5 * monthInMS)) / 1000,
          STAGE_1_FILE: 'test/answers/1.txt',
          STAGE_2_START: (now - 3 * monthInMS) / 1000,
          STAGE_2_END: (now - 2 * monthInMS) / 1000,
          STAGE_2_FILE: 'test/answers/2.txt'
        })
      })

      it(`shouldn't submit after stage 2`, (done) => {
        request.post('/api/submission')
          .set('authorization', `Bearer ${jwt}`)
          .send({ value: '1;2;3;4;5;0' })
          .expect(403, done)
      })

      after(() => {
        process.env = savedEnv
      })
    })

  })

  describe('new submission, with previous submissions', () => {

    it('should work with an active account', (done) => {
      request.post('/api/submission')
        .set('authorization', `Bearer ${jwt}`)
        .send({ value: '1;2;3;4;5;6;7;8;9;0' })
        .expect(201, done)
    })

    it('should not work with the same account', (done) => {
      request.post('/api/submission')
        .set('authorization', `Bearer ${jwt}`)
        .send({ value: 'no value needed because middleware will kick out the request' })
        .expect(403)
        .end((_, res) => {
          expect(res.body.cause).to.be.equal('time')
          done()
        })
    })

    it(`shouldn't work with an other active account on the same @IP`, (done) => {
      request.post('/api/submission')
        .set('authorization', `Bearer ${jwt3}`)
        .send({ value: '1;2;3;4;5;6;7;8;9;0' })
        .expect(403)
        .end((_, res) => {
          expect(res.body.cause).to.be.equal('remote')
          done()
        })
    })

  })

  describe('submission are blocked', () => {
    let savedEnv

    before(() => {
      savedEnv = process.env
      // test syntax of 'true' too
      process.env.BLOCK_SUBMISSION = "tRue"
    })

    it ('should block the submission', (done) => {
      request.post('/api/submission')
        .set('authorization', `Bearer ${jwt3}`)
        .send({ value: '1;2;3;4;5;6;7;8;9;0' })
        .expect(403)
        .end((_, res) => {
          expect(res.body.cause).to.be.equal('blocked')
          done()
        })
    })

    after(() => {
      process.env = savedEnv
    })
  })

  describe('fetch submissions', () => {

    it ('should fetch the submissions with only the needed attributes', (done) => {
      request.get('/api/submission')
        .expect(200)
        .end((err, res) => {
          expect(err).to.be.a('null')
          expect(res.body.submissions[0]).not.to.have.all.keys(['id', 'value', 'updatedAt', 'remoteAddress', 'User'])
          expect(res.body.submissions[0].User).to.have.property('email')
          done()
        })
    })

  })

})