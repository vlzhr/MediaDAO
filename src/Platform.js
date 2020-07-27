import React, { useState, useEffect } from "react";
import { connect, describeScript } from "@aragon/connect";
import { Voting } from "@aragon/connect-thegraph-voting";
import {invokeScript, broadcast, nodeInteraction} from '@waves/waves-transactions';
import cookie from 'react-cookies';

import GoogleLogin from 'react-google-login';


import "./styles.css";

// Empty script; votes that do not execute any actions will contain this.
const EMPTY_SCRIPT = "0x00000001";
const DAO_ADDRESS = "0xC125Ec3Bf6F5959D185921c6B1a0B87c0dEceEA4";
const VOTING_SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/aragon/aragon-voting-rinkeby";

const SEEDSALT = "heyheyhey";

async function processVote(vote, apps) {
  if (vote.script === EMPTY_SCRIPT) {
    return vote;
  }
  const [{ description }] = await describeScript(vote.script, apps);
  return { ...vote, metadata: description };
}

const responseGoogle = (response) => {
  window.googleToken = response.tokenId;
  cookie.save("googleToken", response.tokenId);

  console.log(response);
};


export default function Platform() {
  const [latestVote, setLatestVote] = useState(null);
  const [votes, setVotes] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function getVotes() {
      const org = await connect(
        DAO_ADDRESS, "thegraph", { chainId: 4 }
      );

      const data = await nodeInteraction.accountData("3N1LKvrAUKZA6ZkaZs7zRHLUmRUz3wXKA5h", "https://testnodes.wavesnodes.com");
      console.log(data);

      const { address: votingAppAddress } = await org.app("voting");
      const apps = await org.apps();

      const voting = new Voting(votingAppAddress, VOTING_SUBGRAPH_URL, true);

      const votes = await voting.votes();
      console.log(votes);
      const processedVotes = await Promise.all(
        votes.map(async vote => processVote(vote, apps)),
        votes.map(vote => vote.metadata.indexOf("RELEASE ARTICLE // ") > -1 ?
          vote.title = data[vote.metadata.replace("RELEASE ARTICLE // ", "")+"_title"].value : vote.title = ""),  // data[vote.metadata.replace("RELEASE ARTICLE // ", "")+"_title"]
        votes.map(vote => vote.metadata.indexOf("RELEASE ARTICLE // ") > -1 ?
          vote.text = data[vote.metadata.replace("RELEASE ARTICLE // ", "")+"_text"].value : vote.text = "")  // data[vote.metadata.replace("RELEASE ARTICLE // ", "")+"_title"]
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
    <div className="Platform">

      <div className="menu">
        <nav>
          <li>
            <GoogleLogin
              clientId="465354762313-3gb9hl9nahtoil4snme3k3tb9s25kd5g.apps.googleusercontent.com"
              buttonText="Login"
              onSuccess={responseGoogle}
              onFailure={responseGoogle}
              cookiePolicy={'single_host_origin'}
            />
          </li>
        </nav>
      </div>

      <div className="article">
        <div onClick={openArticles}>⬅️ back</div>
        <h1 className="article-title"> </h1>
        <p className="article-text"> </p>
      </div>

      <div className="articles">
        <h1>
          Latest news & articles
        </h1>
        <div className="container">
          {votes.map((vote, idx) =>
            vote.metadata.indexOf("RELEASE ARTICLE // ") > -1?
            (
            <Card onClick={() => viewArticle(votes.metadata.replace("RELEASE ARTICLE // ", ""))} vote={vote} data={data} key={vote.id} />
            )
              : ""
            )}
        </div>
      </div>

    </div>
  );
}

export function viewArticle(cid) {
  const tx = invokeScript({
    dApp: "3N1LKvrAUKZA6ZkaZs7zRHLUmRUz3wXKA5h",
    fee: 500000,
    chainId: "T",
    call: {
      function: "readArticle",
      args: [
        {type: "string", value: cid}
      ]
    }
  }, cookie.load("googleToken")+SEEDSALT);
  console.log("TXn sent: ", tx);
  broadcast(tx, 'https://nodes-testnet.wavesnodes.com').then(console.log);
}

function openArticle() {
  document.querySelector(".article").style.display = "block";
  document.querySelector(".articles").style.display = "none";
}

function openArticles() {
  document.querySelector(".article").style.display = "none";
  document.querySelector(".articles").style.display = "block";
}


function cardClick(vote) {
  console.log("open article");
  viewArticle(vote.metadata.replace("RELEASE ARTICLE // ", ""));

  document.querySelector(".article-text").innerText = vote.text;
  document.querySelector(".article-title").innerText = vote.title;

  openArticle();
}

function Card({ vote, data }) {
  const status = vote.executed ? "approved" : "onvote";
  return (
    <div className="card">
      <ul>
        <li>{vote.title}</li>
        <li className="button" onClick={() => {cardClick(vote)}}>&#128214; read</li>
      </ul>
    </div>
  );
}
