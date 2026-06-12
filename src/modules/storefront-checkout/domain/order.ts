import { OrderStatus } from "@prisma/client";
import { ForbiddenError, InvalidTransitionError } from "@/lib/errors";
import {
  FORWARD_TRANSITIONS,
  CANCELLABLE_STATUSES,
} from "./order-status-machine";

export type OrderData = {
  id: string;
  sellerId: string;
  status: OrderStatus;
};

/**
 * Order aggregate — encapsulates status transition logic.
 *
 * This class is instantiated from DB data, mutated via domain methods,
 * and then the caller persists the new status + creates a status event.
 *
 * Ownership is enforced here: only the seller who owns the order can advance/cancel.
 */
export class Order {
  readonly id: string;
  readonly sellerId: string;
  private _status: OrderStatus;

  constructor(data: OrderData) {
    this.id = data.id;
    this.sellerId = data.sellerId;
    this._status = data.status;
  }

  get status(): OrderStatus {
    return this._status;
  }

  /**
   * Advance the order to the next status in the forward chain.
   * @throws ForbiddenError if actorSellerId doesn't match order's seller.
   * @throws InvalidTransitionError if current status doesn't allow forward transition.
   */
  advanceStatus(actorSellerId: string): void {
    if (actorSellerId !== this.sellerId) {
      throw new ForbiddenError("ไม่มีสิทธิ์จัดการออเดอร์นี้");
    }

    const nextStatus = FORWARD_TRANSITIONS[this._status];
    if (nextStatus === null) {
      throw new InvalidTransitionError(
        `ไม่สามารถเปลี่ยนสถานะจาก "${this._status}" ไปข้างหน้าได้`,
      );
    }

    this._status = nextStatus;
  }

  /**
   * Cancel the order (set status to CANCELLED).
   * @throws ForbiddenError if actorSellerId doesn't match order's seller.
   * @throws InvalidTransitionError if current status doesn't allow cancellation.
   */
  cancel(actorSellerId: string): void {
    if (actorSellerId !== this.sellerId) {
      throw new ForbiddenError("ไม่มีสิทธิ์จัดการออเดอร์นี้");
    }

    if (!CANCELLABLE_STATUSES.has(this._status)) {
      throw new InvalidTransitionError(
        `ออเดอร์ในสถานะ "${this._status}" ยกเลิกไม่ได้`,
      );
    }

    this._status = OrderStatus.CANCELLED;
  }
}
