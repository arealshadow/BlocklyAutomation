class BlocklyReturnSwagger {
  constructor(url) {
    this.swaggerUrl = url;
  }
  GenerateBlocks = [];
  GenerateFunctions = [];
  fieldXMLObjects = [];
  fieldXMLFunctions = [];
  hasError = true;
  operations=[];
  paths= [];
  name='';
  nameCategSwagger() {
    return `catSwagger${this.findHostNameRegular()}`;
  }
  findCategSwaggerFromPaths(){
    if(this.operations.length>0)
      return this.operations;

    var normalized= this.paths
      .filter(it=> it && it.id && it.id.length >0 )
      .map(it=>{
          var i=it.id.indexOf("{");
          if(i>0) 
            it.id=it.id.substring(0,i);
          
          return it;
      })
       .map(it=>{
         if(it.id.lastIndexOf("/") != it.id.length-1)
             it.id +="/";

         return it;
       });
      
    ;
    var operations=normalized
          .filter(it=>it.nrOps>1)
          //.map(it=>it.id)
          .map(it=> {
            
            var ret= {arr :  it.id.split('/').filter(a=>a.length>0),id : it.id};
            
            return ret;
          })          
          .map(it=>{return { controller:it.arr[it.arr.length-1], id:it.id};} ) ;

    var others = normalized
          .filter(it=>it.nrOps==1)
          .map(it=>
            {
            return { arr : it.id.split('/').filter(a=>a.length>0), id : it.id}
            }
            )
          .map(it=>{
             if(it.arr.length ==1)
                return { controller : it.arr[0], id:it.id};
            return { controller:it.arr[it.arr.length-2], id:it.id};
          })
          ;
    operations.push(...others);
    
    return  [...new Set(operations.map(it=>it.controller))];
}
  categSwagger() {
    var h = this.findHostNameRegular();
    h = h.replaceAll(".", "");
    var max = 5;
    if (h.length > max) var first = h.substring(0, max);
    var categ = this.nameCategSwagger();
    
    return (
      '<category name="obj_' +
      first +
      '" custom="objects_' +
      categ +
      '"></category>' +
      '<category name="api_' +
      first +
      '" custom="api_' +
      categ +
      '"></category>'
    );
    
  }
  findRootSite() {
    var href = this.swaggerUrl;
    var hostname = "";
    if (href.startsWith("http://") || href.startsWith("https://")) {
      var url = new URL(href);

      hostname = url.protocol + "//" + url.hostname;
      if (url.port.length > 0) hostname += url.port;
    }
    return hostname;
  }

  findHostNameRegular() {
    var href = this.swaggerUrl;
    var hostname = "(localSite)";
    if (href.startsWith("http://") || href.startsWith("https://")) {
      var url = new URL(href);
      var port = url.port ?? 80;
      hostname = url.hostname + port;
    }
    return hostname.replaceAll(".", "");
  }
  openApiDocument = null;
  async ParseSwagger() {
    var self = this;
    self.fieldXMLObjects.push(`<label text="${self.swaggerUrl}"></label>`);
    self.fieldXMLFunctions.push({id:'',gui:`<label text="${self.swaggerUrl}"></label>`});
    var r =null;
    try{
    // const SwaggerParser = require("@api-platform/api-doc-parser/lib/openapi3/parseOpenApi3Documentation");
    // var q = await SwaggerParser.default(this.swaggerUrl);
    //var r = q.response;
    const SwaggerParser  = require('swagger-client');
    var q = await SwaggerParser.default(this.swaggerUrl);
    // if(this.swaggerUrl.indexOf('blockly')>0){
    //   console.log("b__",q.spec.paths);
    //     console.log("b__",q.spec.paths["MathDivideRest"]);
    //     console.log("b__",q.apis["MathDivideRest"]);
    // }
      var r=q.spec;
    }
    catch(e){
      console.error(`parseSwagger ${this.swaggerUrl}`,e);      
      self.fieldXMLObjects.push(`<label text='Error parsing!'></label>`); 
      return this;
    }
    this.hasError = false;
    //var r = q.response;
    // console.log(r.paths);
    
    if (r.components?.schemas) {
      var keys = Object.keys(r.components.schemas).sort();
      keys.forEach(function (key) {
        // console.log(key);

        self.fieldXMLObjects.push(`<block type="${key}"></block>`);

        var schema = r.components.schemas[key];
        self.GenerateBlocks.push(self.GenerateBlock(schema, key));
      });
    }
    if (r.paths) {
      Object.keys(r.paths).forEach(function (key) {
        var path = r.paths[key];
        self.paths.push({id: key, nrOps: Object.keys(path).length});
        Object.keys(path).forEach(function (oo) {
          var ops = path[oo];
          self.GenerateFunctions.push(
            self.GenerateFunction(path, key, ops, oo)
          );
        });
      });
    }
    self.openApiDocument = r;
    // console.log(self.openApiDocument);
    return self;
  }
  // findPath(key){
  //   return this.openApiDocument.paths[key];
  // }
  findProperties(schema) {
    var objPropString = [];
    if (schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        //var t = self.TranslateToBlocklyType(schema.properties[key].type);
        // console.log(key, schema.properties[key]);
        objPropString.push({ key: key, value: schema.properties[key] });
      });
    }
    return objPropString;
  }
  GenerateNameFunction(path, key, operation, operationKey) {
    var ret = key.replaceAll("/", "_").replaceAll("{", "__").replaceAll("}","");
    return operationKey + "_" + ret;
  }

  GenerateFunction(path, key, operation, operationKey) {
    
    
    var self = this;

    var blocklyTypeName = self.GenerateNameFunction(
      path,
      key,
      operation,
      operationKey
    );
    var props = "";
    var op = operation;
    //console.log(key);
    //console.log(operationKey);
    // console.log(`assets/httpImages/${operationKey}.png`);
    // console.log(operation);
    self.fieldXMLFunctions.push({id:path,gui:`<block type="${blocklyTypeName}"></block>`});

    return function (blocks, javaScript, BlocklyFieldImage) {
      blocks[blocklyTypeName] = {
        init: function () {
          //this.setInputsInline(true);
          var str = key;
          if (str.length > 15) str = str.substring(0, 25) + "...";
          this.appendDummyInput()
            .appendField(BlocklyFieldImage(operationKey))
            .appendField(`${operationKey} ${str}`);
          var root = self.findRootSite();          
          if (op.parameters)
            op.parameters.forEach((it) => {
              var name= it.name;
              if(it.required){
                name +="*"; 
              }
              if(it.schema && it.schema.type){
                name += ":"+it.schema.type;
              }
              this.appendValueInput(`val_${it.name}`).appendField(name);
            });
          if (op.requestBody) {
            var type="";
            if(op.requestBody.content)
              {
                var jsonResp= op.requestBody.content['application/json'];
                if(jsonResp && jsonResp.schema){
                  var ref=jsonResp.schema["$$ref"];
                  if(ref){
                    type = "=>"+ref.substring(ref.lastIndexOf("/")+1);
                     //var schema=self.openApiDocument.components.schemas[ref.substring(ref.lastIndexOf("/")+1)];
                    // if(schema){
                    //   var properties=self.findProperties(schema);
                    //   properties.forEach((it)=>{
                    //     this.appendValueInput(`val_${it.key}`).appendField(it.key);
                    //   });
                    // }
                  }

                }
              }
            this
              .appendValueInput('val_values')
              .appendField('values' + type)
              .setCheck();
              
              
          }

          this.setTooltip(`${operationKey} ${root}${key}`);
          this.setOutput(true, "");
        },
      };
      javaScript[blocklyTypeName] = function (block) {
        //https://netcoreblockly.herokuapp.com/blocklyAPIFunctions?v=version
        //https://netcoreblockly.herokuapp.com/blockly.html?dom=20211115121043
        // console.log(blocklyTypeName);
        const ORDER_NONE = 99;
        const ORDER_ATOMIC = 0;
        var path = self.openApiDocument.paths[key];
        var operation = path[operationKey];
        // console.log('a' , key);
        // console.log('a' , operationKey);
        // console.log('b',path);
        //  console.log('b',operation);
        // console.log('c',operation.parameters);
        var parameters = [];
        if ("parameters" in operation) {
          parameters = operation.parameters;
        }
        var hasBody=false;
        if('requestBody' in operation){
          hasBody=true;
        }
      //   if (blocklyTypeName.indexOf("RestWithArgs") > 0) {
          
      //     console.log(parameters);
      //  }
        var obj = {};
        var objBody = {};
        if(hasBody){
          obj['val_values'] = javaScript.valueToCode(block, 'val_values', /*javaScript.*/ORDER_ATOMIC);
          objBody['val_values'] =obj['val_values'];
        }
        parameters.forEach((it) => {
          //code +=`
          obj[`val_${it.name}`] = javaScript.valueToCode(
            block,
            `val_${it.name}`,
            /*javascript.*/ ORDER_ATOMIC
          );
          //`;
        });

        var parameterFunctionDefinition = parameters.map((it) => it.name );
        // console.log(parameterFunctionDefinition);
        if(hasBody){          
            parameterFunctionDefinition.push("values");
        }
        parameterFunctionDefinition.push("extraData");
        var callingFunctionDefinition = parameters.map(
          (it) =>"${" + `obj['val_${it.name}']` +"}" + ","
        );
        
        
        callingFunctionDefinition += "1"; //maybe later we use for logging
        var code = "function(";
        code += parameterFunctionDefinition.join(",");
        code += "){\n";
        code += 'var strUrl ="' + self.findRootSite() + key + '";\n';
        var paramsQuery = parameters.filter((it) => it.in == "query");
        if(paramsQuery.length>0){
          code += 'strUrl+="?";\n;';
          var data= paramsQuery.map(it=>`${it.name}=`+"{" + it.name+"}") .join("&");
          // console.log(data);
          // console.log('strUrl += "'+data+'";'); 
          code += 'strUrl += "'+data+'";\n;';
        }

        var replaceUrl = parameters
          .filter((it) => it.in == "path" || it.in == "query")
          .map((it) => `strUrl = strUrl.replace("{${it.name}}",${it.name});`);
        code += replaceUrl.join("\n");

        code +=`\n{var res= ${operationKey}Xhr(strUrl`;
        if(hasBody) {
          code += `,JSON.stringify(values)`;
        }
        code +=`);\n`;
        code +="var resJS=JSON.parse(res);\n";
        code +="if(resJS.statusOK) return resJS.text;\n"
        code +="errHandler(res);\n}\n";
        //code +=";}\n";

        // code += "\nreturn strUrl;\n";

        code += `}`;
        code +="(";
        parameters.forEach((it) => {
          code += obj[`val_${it.name}`]+",";
        });
        if(hasBody){
          code += objBody['val_values']+",";
        }
        // if(hasBody)
        //   code +=`${JSON.stringify(objBody)}`;
        // else
        code +="1";//extra parameter for later

        code +=")";

        //var code =`{GenerateGet(actionInfo)}({argsXHR})`;
        //console.log(code);
        // if (blocklyTypeName.indexOf("MathDivideRest") > 0) {
        //   console.log(code);
        //   // debugger;
        // }

        return [code, /*javaScript.*/ ORDER_NONE];
      };
    };
  }
  GenerateBlock(schema, key) {
    var self = this;
    var blocklyTypeName = key;
    var props = "";
    var objPropString = self.findProperties(schema);

    return function (blocks, javaScript, BlocklyFieldDropdown) {
      //   console.log(blocklyTypeName);

      blocks[blocklyTypeName] = {
        init: function () {
          //this.setInputsInline(true);
         
          var isEnum=false;
          var arrValue = [];
          if(schema.enum){
            isEnum=true;
            var keys= Object.keys(schema.enum);
            arrValue=keys.map((it)=>{
              return [schema.enum[it],it];
            });
           
          }
          
          var b= this.appendDummyInput()
              .appendField(key);
          
          if(isEnum){
            
            b.appendField( BlocklyFieldDropdown(arrValue),`val_${key}`);
            
          }
          else{
          //{tooltipAndpropsDef.propsDef}
          //console.log('init', objPropString);
          objPropString.forEach((item) => {
            //var t = self.TranslateToBlocklyType(key.type);
              // console.log('aa',item);
              var name=item.key;
              if(item.value.nullable && item.value.nullable==false){
                name +="*";
              } 
              if(item.value.type){
                name+=":"+item.value.type;
              }
              if(item.value['$ref']){
                var nameRef=item.value['$ref'].replaceAll("#/components/schemas/","");
                name+="->"+nameRef;
              }
            this.appendValueInput(`val_${item.key}`)
              //   .setCheck('{property.PropertyType.TranslateToNewTypeName()}')
              .appendField(`${name}`);
          });
        }
          //this.setTooltip(`${this.swaggerUrl}`);
          this.setOutput(true, blocklyTypeName);
        },
      };

      javaScript[blocklyTypeName] = function (block) {
        {
          //console.log(blocklyTypeName, self.openApiDocument);
          // var actualSchema = self.openApiDocument.components.schemas[blocklyTypeName];
          // console.log(blocklyTypeName, actualSchema);
          
          var isEnum=false;
          
          if(schema.enum){
            isEnum=true;
          }
          
          var objPropStringFound = self.findProperties(schema);
          //console.log(blocklyTypeName, objPropStringFound);
          const ORDER_NONE = 99;
          const ORDER_ATOMIC = 0;
          var code = "";
          var objPropString = [];
          objPropStringFound.forEach((it) => {
            let val = javaScript.valueToCode(
              block,
              `val_${it.key}`,
              /*javaScript.*/ ORDER_ATOMIC
            );
            //console.log('found ' + val, val);
            if (val === "") {
              val = "null";
            }
            if (val == null) {
              val = "null";
            }
            objPropString.push(`"${it.key}\":${val}`);
          });
          var code = "{ " + objPropString.join(",") + " }";

          if(isEnum){           
            var dropdown_name = block.getFieldValue(`val_${key}`);                    
            code = dropdown_name;            
          }
          //console.log(code);
          return [code, /*javaScript.*/ ORDER_NONE];
        }
      };
    };
  }

  TranslateToBlocklyType(t) {
    if (t == "integer") return "Number";
    if (t == "string") return "String";

    if (t == "bool") return "Boolean";

    if (t == "array") return "Array";
    console.error("not found TranslateToBlocklyType item" + t);
    return "not found type" + t;
  }
}
module.exports = BlocklyReturnSwagger;
