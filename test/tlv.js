/*
* The MIT License (MIT)
*
* Copyright (c) 2014 Ksenia Lebedeva
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

describe('TLV', function() {
  var chai = require('chai').should();
  var tlv = require('../lib/tlv');
  
  describe('#parse', function() {
    it('should return a TLV object when provided a byte array with primitive tag on 1 byte and length on 1 byte.', function() {
      var buf = new Buffer([0x80, 0x04, 0xCA, 0xFE, 0xBA, 0xBE]);
      var res = tlv.parse(buf);
      res.tag.should.equal(0x80);
      res.constructed.should.equal(false);
      res.encodedLength.should.equal(6);
      res.value.should.deep.equal(new Buffer([0xCA, 0xFE, 0xBA, 0xBE]));
      buf[2] = 0xAA;
      res.value.should.deep.equal(new Buffer([0xCA, 0xFE, 0xBA, 0xBE]));
    });
    
    it('should return a TLV object when provided a byte array with primitive tag on 1 byte and length 0x00', function() {
      var res = tlv.parse(new Buffer([0x80, 0x00]));
      res.tag.should.equal(0x80);
      res.constructed.should.equal(false);
      res.encodedLength.should.equal(2);
      res.value.should.deep.equal(new Buffer([]));
    });
    
    it('should return a TLV object when provided a byte array with primitive tag on 1 byte and length 0x7F', function() {
      var buf = new Buffer(129);
      buf[0] = 0x80;
      buf[1] = 0x7F
      
      for (i = 2; i < buf.length; i++) {
        buf[i] = i;
      }
      
      var res = tlv.parse(buf);
      res.tag.should.equal(0x80);
      res.constructed.should.equal(false);
      res.encodedLength.should.equal(buf.length);
      res.value.should.deep.equal(buf.slice(2, buf.length));
    });
    
    it('should return a TLV object when provided a byte array with primitive tag on 1 byte and length on 2 bytes', function() {
      var buf = new Buffer(131);
      buf[0] = 0xC4;
      buf[1] = 0x81;
      buf[2] = 0x80;
      
      for (i = 3; i < buf.length; i++) {
        buf[i] = i;
      }
      
      var res = tlv.parse(buf);
      res.tag.should.equal(0xC4);
      res.constructed.should.equal(false);
      res.encodedLength.should.equal(buf.length);
      res.value.should.deep.equal(buf.slice(3, buf.length));
    });
    
    it('should return a TLV object when provided a byte array with primitive tag on 1 byte and length on 3 bytes and spurious data at end', function() {
      var buf = new Buffer(0x109);
      buf[0] = 0x80;
      buf[1] = 0x82;
      buf[2] = 0x01;
      buf[3] = 0x00;
      
      for (i = 4; i < buf.length; i++) {
        buf[i] = i;
      }
      
      var res = tlv.parse(buf);
      res.tag.should.equal(0x80);
      res.constructed.should.equal(false);
      res.encodedLength.should.equal((buf.length - 5));
      res.value.should.deep.equal(buf.slice(4, (buf.length - 5)));
    });
    
    it('should return a TLV object when provided a byte array with primitive tag on 1 byte and length on 4 bytes and spurious data at end', function() {
      var buf = new Buffer(0x1000A);
      buf[0] = 0x12;
      buf[1] = 0x83;
      buf[2] = 0x01;
      buf[3] = 0x00;
      buf[4] = 0x00;
      
      for (i = 5; i < buf.length; i++) {
        buf[i] = i;
      }
      
      var res = tlv.parse(buf);
      res.tag.should.equal(0x12);
      res.constructed.should.equal(false);
      res.encodedLength.should.equal(buf.length - 5);
      res.value.should.deep.equal(buf.slice(5, (buf.length - 5)));
    });
    
    it('should return a TLV object when provided a byte array with primitive tag on 1 byte and length on 5 bytes and spurious data at end', function() {
      var buf = new Buffer(0x100000B);
      buf[0] = 0x80;
      buf[1] = 0x84;
      buf[2] = 0x01;
      buf[3] = 0x00;
      buf[4] = 0x00;
      buf[5] = 0x00;
      
      for (i = 6; i < buf.length; i++) {
        buf[i] = i;
      }
      
      var res = tlv.parse(buf);
      res.tag.should.equal(0x80);
      res.constructed.should.equal(false);
      res.encodedLength.should.equal(buf.length - 5);
      res.value.should.deep.equal(buf.slice(6, (buf.length - 5)));
    });
    
    it('should return throw an exception when provided a byte array with primitive tag on 1 byte and length on 6 bytes', function() {
      var buf = new Buffer(0x1000007);
      buf[0] = 0x80;
      buf[1] = 0x85;
      buf[2] = 0x01;
      buf[3] = 0x00;
      buf[4] = 0x00;
      buf[5] = 0x00;
      buf[6] = 0x00;
      
      (function(){ tlv.parse(buf); }).should.throw(RangeError);
    });
    
    it('should return a TLV object when provided a byte array with constructed tag on 1 byte and length on 1 byte.', function() {
      var res = tlv.parse(new Buffer([0xE1, 0x08, 0x80, 0x02, 0xBA, 0xBE, 0x82, 0x02, 0xBB, 0xBC]));
      res.tag.should.equal(0xE1);
      res.constructed.should.equal(true);
      res.encodedLength.should.equal(10);
      res.value.should.deep.equal([{tag: 0x80, value: new Buffer([0xBA, 0xBE]), constructed: false, encodedLength: 4}, {tag: 0x82, value: new Buffer([0xBB, 0xBC]), constructed: false, encodedLength: 4}]);
    });
    
    it('should return a TLV object when provided a byte array with constructed tlvs with 2 levels of nesting', function() {
      var res = tlv.parse(new Buffer([0xE1, 0x0A, 0xA0, 0x04, 0x82, 0x02, 0xCA, 0xFE, 0x83, 0x02, 0xBB, 0xBC]));
      res.tag.should.equal(0xE1);
      res.constructed.should.equal(true);
      res.encodedLength.should.equal(12);
      res.value.should.deep.equal([{
        tag: 0xA0, 
        value: [ {tag: 0x82, value: new Buffer([0xCA, 0xFE]), constructed: false, encodedLength: 4} ], 
        constructed: true, 
        encodedLength: 6
      }, 
      { tag: 0x83, value: new Buffer([0xBB, 0xBC]), constructed: false, encodedLength: 4}
      ]);
    });
    
    it('should return a TLV object when provided a byte array with primitive tag on 2 bytes and length on 2 bytes.', function() {
      var res = tlv.parse(new Buffer([0x9F, 0x70, 0x81, 0x04, 0xCA, 0xFE, 0xBA, 0xBE]));
      res.tag.should.equal(0x9F70);
      res.constructed.should.equal(false);
      res.encodedLength.should.equal(8);
      res.value.should.deep.equal(new Buffer([0xCA, 0xFE, 0xBA, 0xBE]));
    });
    
    it('should return a TLV object when provided a byte array with primitive tag on 3 bytes and length on 2 bytes.', function() {
      var res = tlv.parse(new Buffer([0x9F, 0x85, 0x22, 0x81, 0x04, 0xCA, 0xFE, 0xBA, 0xBE]));
      res.tag.should.equal(0x9F8522);
      res.constructed.should.equal(false);
      res.encodedLength.should.equal(9);
      res.value.should.deep.equal(new Buffer([0xCA, 0xFE, 0xBA, 0xBE]));
    });
  });
});