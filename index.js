const parseExpr = (prog) => {
  let match;
  let expr;

  if (match = /^[\/\+\-\*]/.exec(prog)) {
    expr = { type: 'operator', val: match[0] };
  } else if (match = /^\d+/.exec(prog)) {
    expr = { type: 'number', val: +match[0] };
  }

  if (match) prog = prog.slice(match[0].length);

  return parseTokens(expr, prog);
};

const parseTokens = (expr, prog) => {
  prog = prog.trim();

  if (expr.type !== 'operator')
    return { expr, prog };

  expr = { type: 'operation', operator: expr, args: [] };
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
  if (prog[0] !== '(') throw new Error("Unexpected token: " + prog[0] + ".");
  
  prog = prog.slice(1);

  return parseExpr(prog);
};



console.log(
  JSON.stringify(parse(`(+ (* 16 10) (- 7 6))`))
);
