
const statements = {};
const globalScope = {};

const doperators = {};
for (const op of ['+', '*', '-', '/', '>', '!=', '<', '>=', '<=', '==']) {
  doperators[op] = new Function('a', 'b', `return a${op}b`);
}

const soperators = {};
for (const op of ['!', '-', '+']) {
  soperators[op] = new Function('a', `return ${op}a`);
}

statements.if = (scope, cond, ifbody, elsebody) => {
  return Boolean(cond.val) 
  ? evaluate(ifbody, scope) 
  : (elsebody ? evaluate(elsebody, scope) : undefined);
};


statements.def = (scope, varName, varVal) => {
  scope[varName.val] = evaluate(varVal); 
};

statements.do = (scope, ...args) => {
  let res = null;
  for (let arg of args) {
    res = evaluate(arg, scope);
  }
  return res;
};

statements.print = (scope, ...args) => {
  for (let arg of args) {
    // console.log(arg);
    if (arg.type === "var" && scope[arg.val]) console.log(scope[arg.val]);
    else console.log(evaluate(arg, scope));
  }
};

statements.while = (scope, cond, body) => {};

const parseExpr = (prog) => {
  let match;
  let expr;

  prog = prog.trim();

  if (match = /^[^\s(),#\d]+/.exec(prog)) {
    if (!statements[match[0]] && !doperators[match[0]] && !soperators[match[0]])
      expr = { type: 'var', val: match[0] }; 
    else expr = { type: 'operator', val: match[0] };
  } else if (match = /^\d+/.exec(prog)) {
    expr = { type: 'operand', val: +match[0] };
  }

  if (match) prog = prog.slice(match[0].length);

  prog = prog.trim();

  return parseTokens(expr, prog);
};

const parseTokens = (expr, prog) => {
  prog = prog.trim();

  if (expr.type !== 'operator')
    return { expr, prog };

  expr = { type: 'operation', action: expr, args: [] };
  while (prog[0] !== ')') {
    prog = prog.trim();
    let res;
    if (prog[0] === '(')
      res = parse(prog);
    else res = parseExpr(prog);

    expr.args.push(res.expr);
    prog = res.prog.trim();
  }

  return parseTokens(expr, prog.slice(1));
};

const parse = (prog) => {
  prog = prog.trim();
  if (prog[0] !== '(') 
    throw new Error("Unexpected token: " + prog[0] + ".");

  prog = prog.slice(1);

  return parseExpr(prog);
};

const evaluate = (obj, scope) => {
  if (!obj) return;
  else if (obj.type === "operand") {
    return obj.val;
  }
  else if (obj.type === "var") {
    if (scope[obj.val]) return scope[obj.val];
    throw new Error("No variable with name " + obj.val + " has been found.");
  }
  else if (obj.type === "operator") {
    const [a, b] = obj.args.map((item) => evaluate(item, scope));
    const operResult = 
      obj.args.length === 1 
        ? soperators[obj.val](a) 
        : doperators[obj.val](a, b);
    if (operResult === undefined) 
      throw new Error(`Error while evaluating ${obj.val}`);
    return operResult;
  } else if (obj.type === "operation") {
    if (statements[obj.action.val]) {
      // console.log(obj.args);
      return statements[obj.action.val](scope, ...obj.args);
    }
    return evaluate({ ...obj.action, args: obj.args }, scope);
  }
};

const parsed = parse(`
  (do (def yes 5) (print (> yes 6)))
`);

evaluate(parsed.expr, globalScope);
