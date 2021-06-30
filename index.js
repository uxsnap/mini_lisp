const parseExpr = (prog) => {
  let match;
  let expr;

  prog = prog.trim();

  if (match = /^[^\s(),#\d]+/.exec(prog)) {
    expr = { type: 'operator', val: match[0] };
  } else if (match = /^\d+/.exec(prog)) {
    expr = { type: 'operand', val: +match[0] };
  }

  if (match) prog = prog.slice(match[0].length);

  return parseTokens(expr, prog);
};

const parseTokens = (expr, prog) => {
  prog = prog.trim();

  if (expr.type !== 'operator')
    return { expr, prog };

  expr = { type: 'operation', action: expr, args: [] };
  while (prog) {
    prog = prog.trim();
    let res;
    if (prog[0] === '(')
      res = parse(prog);
    else res = parseExpr(prog);
    expr.args.push(res.expr);
    prog = res.prog.trim();
    if (prog[0] === ',')
      console.log(prog)
  }

  return parseTokens(expr, prog.slice(1));
};

const parse = (prog) => {
  prog = prog.trim();
  if (prog[0] !== '(') throw new Error("Unexpected token: " + prog[0] + ".");

  prog = prog.slice(1);

  return parseExpr(prog);
};

const doperators = {};
for (const op of ['+', '*', '-', '/']) {
  doperators[op] = new Function('a', 'b', `return a${op}b`);
}

const soperators = {};
for (const op of ['!', '-', '+']) {
  soperators[op] = new Function('a', `return ${op}a`);
}

const statements = {};
const globalScope = {};

const evaluate = (obj, scope) => {
  if (!obj) return;
  else if (obj.type === "operand")
    return obj.val;
  else if (obj.type === "operator") {
    const [a, b] = obj.args.map((item) => evaluate(item));
    const operResult = 
      obj.args.length === 1 
        ? soperators[obj.val](a) 
        : doperators[obj.val](a, b);
    if (!operResult) 
      throw new Error(`Error while evaluating ${obj.val}`);
    return operResult;
  } else if (obj.type === "operation") {
    if (statements[obj.action.val]) {
      const res = statements[obj.action.val](...obj.args, scope);
      // console.log(res);
      return res;
    }
    return evaluate({ ...obj.action, args: obj.args }, scope);
  }
};

statements.if = (cond, ifbody, elsebody, scope) => {
  return Boolean(cond.val) 
  ? evaluate(ifbody, scope) 
  : (elsebody ? evaluate(elsebody, scope) : undefined);
};


statements.var = (varName, varVal, scope) => {
  scope[varName.action.val] = evaluate(varVal); 
};

const parsed = parse(`
  (if (1
    (if (1 
      (+ 
        (* 16 10) 
        (- 6)
      ) 10
    ) 6
  ) (print 6)
`);

console.log(JSON.stringify(parsed.expr));

// console.log(
//   evaluate(parsed.expr, globalScope)
// );
