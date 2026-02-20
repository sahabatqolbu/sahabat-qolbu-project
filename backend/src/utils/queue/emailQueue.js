// backend/src/utils/queue/emailQueue.js
// Simple in-memory email queue with retry support

import { logger } from "../logger.js";
import { sendEmailSync } from "../email.js";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 60000];

class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.currentJob = null;
    this.stats = {
      queued: 0,
      processed: 0,
      failed: 0,
      retries: 0,
    };
  }

  add(job) {
    const emailJob = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...job,
      attempts: 0,
      status: "queued",
      createdAt: new Date(),
      addedAt: new Date(),
    };

    this.queue.push(emailJob);
    this.stats.queued++;

    logger.info("Email queued", { jobId: emailJob.id, to: job.to });

    if (!this.processing) {
      this.process();
    }

    return emailJob.id;
  }

  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      this.currentJob = job;
      job.status = "processing";
      job.startedAt = new Date();

      logger.debug("Processing email job", { jobId: job.id, attempt: job.attempts + 1 });

      try {
        const result = await this.processJob(job);

        if (result.success) {
          job.status = "completed";
          job.completedAt = new Date();
          this.stats.processed++;
          logger.info("Email sent successfully", { jobId: job.id, messageId: result.messageId });
        } else {
          await this.handleFailure(job, result.error);
        }
      } catch (error) {
        await this.handleFailure(job, error.message);
      }

      this.currentJob = null;

      if (this.queue.length > 0) {
        await this.sleep(1000);
      }
    }

    this.processing = false;
  }

  async processJob(job) {
    const { type, to, subject, text, html, ...rest } = job;

    return await sendEmailSync({ to, subject, text, html, ...rest });
  }

  async handleFailure(job, error) {
    job.attempts++;
    job.lastError = error;
    job.lastAttemptAt = new Date();

    if (job.attempts < MAX_RETRIES) {
      job.status = "retry";
      const delay = RETRY_DELAYS[job.attempts - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      
      logger.warn("Email failed, scheduling retry", { 
        jobId: job.id, 
        attempt: job.attempts, 
        maxRetries: MAX_RETRIES,
        delay,
        error 
      });

      this.stats.retries++;

      setTimeout(() => {
        this.queue.push(job);
        this.process();
      }, delay);
    } else {
      job.status = "failed";
      job.failedAt = new Date();
      this.stats.failed++;

      logger.error("Email job failed permanently", { 
        jobId: job.id, 
        attempts: job.attempts, 
        error 
      });
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      currentJob: this.currentJob ? {
        id: this.currentJob.id,
        to: this.currentJob.to,
        status: this.currentJob.status,
        attempts: this.currentJob.attempts,
      } : null,
    };
  }

  getQueue() {
    return this.queue.map(j => ({
      id: j.id,
      to: j.to,
      subject: j.subject,
      status: j.status,
      attempts: j.attempts,
      createdAt: j.createdAt,
    }));
  }

  clearQueue() {
    const count = this.queue.length;
    this.queue = [];
    logger.info("Email queue cleared", { clearedCount: count });
    return count;
  }
}

export const emailQueue = new EmailQueue();

export const addToEmailQueue = (job) => emailQueue.add(job);

export const getEmailQueueStats = () => emailQueue.getStats();

export const getEmailQueueList = () => emailQueue.getQueue();

export const clearEmailQueue = () => emailQueue.clearQueue();
