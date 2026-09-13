import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

export const asyncHandler =
  <
    P extends ParamsDictionary = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
  >(
    handler: RequestHandler<P, ResBody, ReqBody, ReqQuery>,
  ): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
