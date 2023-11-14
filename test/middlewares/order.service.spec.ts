import { Request, Response } from "express";
import { order } from "./../../src/middlewares/order.service";
import { col } from "sequelize";

describe("Order Middleware", () => {
  let model: any;
  let req: Partial<Request> & { query: any }; // Ensure 'query' is defined in req
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    model = {
      primaryKeyAttribute: "id",
      getAttributes: jest.fn(() => ({
        id: { field: "id" },
        createdAt: { field: "createdAt" },
        otherAttribute: { field: "otherAttribute" },
      })),
    } as any;
    req = {
      query: { order: undefined }, // Define 'query' here
    } as Partial<Request> & { query: any };
    res = {
      status: jest.fn().mockReturnThis(), // Ensure 'status' returns 'this' (res) for chaining
      json: jest.fn(),
    } as unknown as Response; // Explicitly define res as Response
    next = jest.fn();
  });

  it("should set default order when req.query.order is undefined", async () => {
    await order(model, req as Request, res as Response, next);

    expect(req.query).toBeDefined();
    expect(req.query.order).toBeDefined();
    expect(req.query.order).toEqual([[col("createdAt"), "DESC"]]);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should set order by id when req.query.order is undefined and createdAt does not exists", async () => {
    model.getAttributes = jest.fn(() => ({
      id: { field: "id" },
      otherAttribute: { field: "otherAttribute" },
    }));

    await order(model, req as Request, res as Response, next);

    expect(req.query).toBeDefined();
    expect(req.query.order).toBeDefined();
    expect(req.query.order).toEqual([[col("id"), "DESC"]]);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should return a valid order when req.query.order is defined", async () => {
    req.query.order = "otherAttribute:asc";

    await order(model, req as Request, res as Response, next);

    expect(req.query).toBeDefined();
    expect(req.query.order).toBeDefined();
    expect(req.query.order).toEqual([[col("otherAttribute"), "ASC"]]);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should respond with 500 and an error message for invalid attribute", async () => {
    req.query.order = "invalidAttribute:asc";

    // Mock the error handling for 500 response
    const errorSpy = jest.spyOn(console, "error").mockImplementation();
    const statusSpy = jest
      .spyOn(res, "status")
      .mockReturnValue(res as Response);
    const jsonSpy = jest.spyOn(res, "json");

    await order(model, req as Request, res as Response, next);

    expect(errorSpy).toHaveBeenCalled();
    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith({ error: "Internal server error" });

    errorSpy.mockRestore();
  });
});
