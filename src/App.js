import React, { useState, useEffect } from "react";
import { connect, describeScript } from "@aragon/connect";
import { Voting } from "@aragon/connect-thegraph-voting";
import Signer from '@waves/signer';
import Provider from '@waves.exchange/provider-web';

import "./styles.css";

// Empty script; votes that do not execute any actions will contain this.
const EMPTY_SCRIPT = "0x00000001";
const DAO_ADDRESS = "0xC125Ec3Bf6F5959D185921c6B1a0B87c0dEceEA4";
const VOTING_SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/aragon/aragon-voting-rinkeby";

export const signer = new Signer({NODE_URL: 'https://nodes-testnet.wavesnodes.com'});
signer.setProvider(new Provider('https://testnet.waves.exchange/signer/'));


function checkVoteAccepted(vote) {
  return true;
}


async function processVote(vote, apps) {
  if (vote.script === EMPTY_SCRIPT) {
    return vote;
  }

  const [{ description }] = await describeScript(vote.script, apps);
  return { ...vote, metadata: description };
}

export default function App() {
  const [latestVote, setLatestVote] = useState(null);
  const [votes, setVotes] = useState(null);

  useEffect(() => {
    async function getVotes() {
      const org = await connect(
        DAO_ADDRESS, "thegraph", { chainId: 4 }
      );

      const { address: votingAppAddress } = await org.app("voting");
      const apps = await org.apps();

      const voting = new Voting(votingAppAddress, VOTING_SUBGRAPH_URL, true);

      const votes = await voting.votes();
      // console.log(votes);
      const processedVotes = await Promise.all(
        votes.map(async vote => processVote(vote, apps))
      );
      processedVotes.reverse();
      setVotes(processedVotes);
      setLatestVote(processedVotes[0].metadata);
    }
    getVotes();
  }, []);

  if (!votes) {
    return <h1>Loading 🔄</h1>;
  }

  return (
    <div className="App">

      <div className="menu">
        <nav>
          <li onClick={openSubmit}>Submit Form</li>
          <li onClick={openTasks}>Projects List</li>
        </nav>
      </div>

      <div className="submit-article-desk">
        <h1>
          Create an article for the community!
        </h1>
        <ArticleSubmitForm  />
      </div>

      <div className="tasks-desk">
        <h1>
          Write an article to be published and earn VIEWERS 💸
        </h1>
        <div className="container">
          {votes.map((vote, idx) =>
            vote.metadata.indexOf("NEW ARTICLE // ") > -1 && checkVoteAccepted(vote) ? (
              <Card vote={vote} idx={votes.length - idx} key={vote.id} />
            ) : "")
          }
        </div>
      </div>

    </div>
  );
}

export function submitArticle() {
  const title = document.querySelector(".article-title").value;
  const aid = document.querySelector(".article-id").value;
  const text = document.querySelector(".article-text").value;

   signer.invoke({dApp: "3N1LKvrAUKZA6ZkaZs7zRHLUmRUz3wXKA5h", fee: 500000,
      payment: [],
      call: {function: "submitArticle", args: [
        {value: aid, type: "string"},
        {value: title, type: "string"},
        {value: text, type: "string"}]
  }}).broadcast();
  // signer.transfer({recipient: "3N1LKvrAUKZA6ZkaZs7zRHLUmRUz3wXKA5h", amount: 1, assetId: "WAVES"}).broadcast();
}

function openSubmit() {
  document.querySelector(".submit-article-desk").style.display = "block";
  document.querySelector(".tasks-desk").style.display = "none";
}

function openTasks() {
  document.querySelector(".submit-article-desk").style.display = "none";
  document.querySelector(".tasks-desk").style.display = "block";
}


function cardClick(vote) {
  document.querySelector(".article-id").value = vote.id.split(":")[2];
  document.querySelector(".article-title").value = vote.metadata.replace("NEW ARTICLE // ", "");
  openSubmit();
}

function Card({ vote, idx }) {
  const status = vote.executed ? "approved" : "onvote";
  return (
    <div className="card" onClick={() => {cardClick(vote)}}>
      <ul>
        <li>{vote.metadata.replace("NEW ARTICLE // ", "")}</li>
        <li>Article ID: {vote.id.split(":")[2]}</li>
        <li className={status}><a target="_blank" href={"https://rinkeby.aragon.org/#/media/" +
        vote.appAddress +
        "/vote/"+(idx-1)+"/"}>{status}</a></li>
      </ul>
    </div>
  );
}

function ArticleSubmitForm() {
  return (
    <div className="">
      <input type="text" className="article-id" placeholder="Article ID" />
      <input type="text" className="article-title" placeholder="Article Title" />
      <textarea className="article-text" name="text" id="" cols="30" rows="10"></textarea>
      <button onClick={submitArticle}>Send to the Board</button>
    </div>
  )
}