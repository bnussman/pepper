import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";

export interface Context {
  em: EntityManager<IDatabaseDriver<Connection>>;
}
