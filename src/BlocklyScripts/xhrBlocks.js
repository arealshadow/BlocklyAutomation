exports.definitionBlocks = function (blocks, javaScript, BlocklyFieldDropdown) {
    // console.log(BlocklyFieldDropdown);
    const ORDER_ATOMIC = 0;
    const ORDER_NONE=99;


    blocks['headersbeforehttp'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Add Headers");
        this.appendValueInput("HttpDomain")
            .setCheck("String")
            .appendField("Domain");
        this.appendValueInput("HeaderName")
            .setCheck("String")
            .appendField("Header Name");
        this.appendValueInput("HeaderValue")
            .setCheck("String")
            .appendField("Header Value");
      this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        //this.setColour(230);
     //this.setTooltip("");
     //this.setHelpUrl("");
      }
    };
    javaScript['headersbeforehttp'] = function(block) {
      var value_httpdomain = javaScript.valueToCode(block, 'HttpDomain', /*javaScript.*/ORDER_ATOMIC)||'(localSite)';
      var value_headername = javaScript.valueToCode(block, 'HeaderName', /*javaScript.*/ORDER_ATOMIC);
      var value_headervalue = javaScript.valueToCode(block, 'HeaderValue', /*javaScript.*/ORDER_ATOMIC);
      
      var code = '\n';//'alert("a" + JSON.stringify(headersForDomain)+"a");\n';
      code +='{\n';
      code +='if(!(' + value_httpdomain + ' in headersForDomain))\n';
      code +='{\n';
      code +='headersForDomain[' + value_httpdomain +']=[];\n';
      code +='};\n';
      code +='var arr = headersForDomain[' + value_httpdomain +'];\n';
      code +='arr.push({name:' + value_headername +', value:'+value_headervalue+'});\n';
      code +='//alert("a" + JSON.stringify(arr)+"a");\n';
      code +='//alert("a" + JSON.stringify(headersForDomain[' + value_httpdomain +'])+"a");\n';
      code +='};\n';
      return code;
    };

  blocks["httprequest"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(
          /*new*/ BlocklyFieldDropdown([
            ["JSON", "JSON"],
            ["Text", "Text"],
          ]),
          "TypeOutput"
        )
        .appendField("HttpRequest");
      this.appendValueInput("TheUrl")
        .setCheck(null)
        .appendField(
          /*new*/ BlocklyFieldDropdown([
            ["GET", "GET"],
            ["POST", "POST"],
          ]),
          "TypeRequest"
        )
        .appendField("URL");
      this.appendValueInput("Data").setCheck(null).appendField("Data");
      this.setOutput(true, null);
      //this.setColour(230);
      //this.setTooltip("");
      //this.setHelpUrl("");
    },
  };

  javaScript["httprequest"] = function (block) {
    var dropdown_typeoutput = block.getFieldValue("TypeOutput");
    var dropdown_typerequest = block.getFieldValue("TypeRequest");
    var value_theurl = javaScript.valueToCode(
      block,
      "TheUrl",
      /*javaScript.*/ORDER_ATOMIC
    );
    var value_data = javaScript.valueToCode(
      block,
      "Data",
      /*javaScript.*/ORDER_ATOMIC
    );
    var operation = "";
    switch (dropdown_typerequest.toString()) {
      case "GET":
        operation =
          "(function(url){ var res=JSON.parse(getXhr(url)); if(res.statusOK) return res.text;errHandler(JSON.stringify(res)); throw res;}(" +
          value_theurl +
          ") )";
        break;
      case "POST":
        operation =
          "(function(url,data){ var res=JSON.parse(postXhr(url,JSON.stringify(data))); if(res.statusOK) return res.text;errHandler(JSON.stringify(res)); throw res;}(" +
          value_theurl +
          "," +
          value_data +
          ") )";
        break;
    }

    var code = operation;
    switch (dropdown_typeoutput) {
      case "JSON":
        code = "JSON.parse(" + code + ")";
    }

    return [code, /*javaScript.*/ORDER_NONE];
  };
};

exports.fieldXML =function(){
    return `
    
    <block type="headersbeforehttp">
    <value name="HttpDomain">
        <shadow type="text">
            <field name="TEXT">(localSite)</field>
        </shadow>
    </value>
    <value name="HeaderName">
        <shadow type="text">
            <field name="TEXT">Authorization</field>
        </shadow>
    </value>
    <value name="HeaderValue">
        <shadow type="text_join">

        </shadow>
    </value>
</block>
<block type="text_print">
<value name="TEXT">

    <block type="httprequest">
    <value name="TheUrl">
        <shadow type="text">
            <field name="TEXT">https://httpbin.org/get</field>
        </shadow>
    </value>
</block>
</value>
</block>    

`
}